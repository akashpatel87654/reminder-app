import 'expo-sqlite/localStorage/install';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { daysUntil, money, parseDate, today, when, type Subscription } from './subs';

const CHANNEL = 'reminders';
const IOS_LIMIT = 60; // iOS keeps at most 64 pending; the rest get scheduled on a later resync.
const HANDLED_KEY = 'handledReminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

const web = Platform.OS === 'web'; // browser preview only: no local notifications there.

export type NotifState = 'granted' | 'denied' | 'undetermined';

export async function notifState(): Promise<{ state: NotifState; canAsk: boolean }> {
  if (web) return { state: 'granted', canAsk: false };
  const p = await Notifications.getPermissionsAsync();
  // Android 13+ reports 'denied' before the app has ever asked; while it can still ask, that's really "not asked yet".
  const state: NotifState = p.status !== 'granted' && p.canAskAgain ? 'undetermined' : (p.status as NotifState);
  return { state, canAsk: p.canAskAgain };
}

export async function askPermission() {
  if (web) return true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  return (await Notifications.requestPermissionsAsync()).status === 'granted';
}

export function reminderText(s: Subscription, d: number) {
  const w = when(d);
  const title = s.type === 'free_trial' ? `${s.name} trial ends ${w}. cancel or commit.`
    : s.type === 'expires' ? `${s.name} expires ${w}. renew or let it go.`
    : `${s.name} wants ${money(s.price, s.currency)} ${w} 👀`;
  return { title, body: 'tap to deal with it before it deals with you' };
}

// "send me a test nag": fires right now for the given sub.
export async function testNag(s: Subscription) {
  if (web) return;
  await Notifications.scheduleNotificationAsync({ content: { ...reminderText(s, daysUntil(s.next_date)), data: { subId: s.id } }, trigger: null });
}

// Keys (sub:date:daysBefore) the OS already owns or we already fired, so a past-due
// reminder fires once, not on every app open. Stale dates are pruned.
function loadHandled(): Set<string> {
  try {
    const t = today();
    return new Set((JSON.parse(localStorage.getItem(HANDLED_KEY) ?? '[]') as string[]).filter((k) => k.split(':')[1] >= t));
  } catch {
    return new Set();
  }
}

// Rebuild every pending notification from the current DB state. Cheap, and edits,
// cancels and deletes need no bookkeeping. Calls are serialized so two focus
// events can't interleave cancel/schedule and double-book.
let running = Promise.resolve();
// `enabled` = OS permission granted and the in-app push toggle on; otherwise just clear.
export const syncReminders = (subs: Subscription[], hour: number, enabled: boolean) =>
  (running = running.then(() => (web ? undefined : sync(subs, hour, enabled))).catch((e) => console.warn('reminder sync failed', e)));

async function sync(subs: Subscription[], hour: number, enabled: boolean) {
  if (!enabled) return Notifications.cancelAllScheduledNotificationsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  const now = Date.now();
  const handled = loadHandled();
  const future: { at: Date; s: Subscription; d: number }[] = [];
  const fireNow: { s: Subscription; d: number }[] = [];

  for (const s of subs) {
    if (s.status !== 'active' || daysUntil(s.next_date) < 0) continue;
    let pastDue = false;
    for (const d of s.remind_days_before) {
      const at = parseDate(s.next_date);
      at.setDate(at.getDate() - d);
      at.setHours(hour, 0, 0, 0);
      const key = `${s.id}:${s.next_date}:${d}`;
      if (at.getTime() > now) future.push({ at, s, d });
      else if (!handled.has(key)) {
        pastDue = true;
        handled.add(key);
      }
    }
    // Added or edited inside the window: one reminder now, worded for the real gap.
    if (pastDue) fireNow.push({ s, d: daysUntil(s.next_date) });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  future.sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const { at, s, d } of future.slice(0, IOS_LIMIT)) {
    await Notifications.scheduleNotificationAsync({
      content: { ...reminderText(s, d), data: { subId: s.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
    handled.add(`${s.id}:${s.next_date}:${d}`);
  }
  for (const { s, d } of fireNow) {
    await Notifications.scheduleNotificationAsync({ content: { ...reminderText(s, d), data: { subId: s.id } }, trigger: null });
  }
  try {
    localStorage.setItem(HANDLED_KEY, JSON.stringify([...handled]));
  } catch {}
}

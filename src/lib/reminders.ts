import 'expo-sqlite/localStorage/install';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { daysUntil, money, parseDate, today, type Subscription } from './subs';
import { supabase } from './supabase';

const CHANNEL = 'reminders';
const IOS_LIMIT = 60; // iOS keeps at most 64 pending; the rest get scheduled on a later resync.
const HANDLED_KEY = 'handledReminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  return (await Notifications.requestPermissionsAsync()).status === 'granted';
}

const when = (d: number) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);
export function reminderText(s: Subscription, d: number) {
  const price = money(s.price, s.currency);
  switch (s.type) {
    case 'auto_renew':
      return { title: `${s.name} renews ${when(d)}`, body: `${price} will be charged on ${s.next_date}. Cancel before then if you don't need it.` };
    case 'free_trial':
      return { title: `${s.name} trial ends ${when(d)}`, body: `${price} will be charged on ${s.next_date} unless you cancel.` };
    case 'expires':
      return { title: `${s.name} expires ${when(d)}`, body: `Renew before ${s.next_date} to keep access.` };
  }
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
export const syncReminders = (subs: Subscription[]) =>
  (running = running.then(() => sync(subs)).catch((e) => console.warn('reminder sync failed', e)));

async function sync(subs: Subscription[]) {
  if (!(await ensurePermission())) return;
  const { data: profile } = await supabase.from('profiles').select('reminder_hour').maybeSingle();
  const hour = profile?.reminder_hour ?? 9;
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

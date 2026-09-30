import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Confirm, useFx } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { Btn, Letter, PopIn, RoundBtn, Rise, T } from '../../components/ui';
import { useStore } from '../../lib/store';
import { addDays, daysUntil, fmtDay, hourLabel, line, money, priceLabel, reminderAt, toMonthly, TYPES } from '../../lib/subs';
import { border, C, PALETTE, shadow } from '../../theme';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subs, profile, patch, remove } = useStore();
  const { toast } = useFx();
  const [confirm, setConfirm] = useState(false);
  const d = subs.find((s) => s.id === id);
  if (!d) return <Redirect href="/subs" />;

  const cur = profile?.currency ?? 'INR';
  const active = d.status === 'active';
  const days = daysUntil(d.next_date);
  const emails = d.email_enabled && (profile?.email_enabled ?? true);

  async function toggleCancel() {
    const next = active ? 'cancelled' : 'active';
    try {
      const { queued } = await patch(d!.id, { status: next });
      toast(queued ? 'saved offline ✦ syncs when you’re back' : next === 'cancelled' ? 'cancelled. your wallet says thx 💸' : 'back from the dead ✦ reminders on');
    } catch {
      toast('couldn’t save that. try again');
    }
  }
  async function doDelete() {
    setConfirm(false);
    try {
      const { queued } = await remove(d!.id);
      toast(queued ? 'gone ✦ syncs when you’re back' : 'gone. poof. 💨');
      router.back();
    } catch {
      toast('couldn’t delete that. try again');
    }
  }

  return (
    <Screen scroll>
      <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RoundBtn />
        <Pressable onPress={() => router.push({ pathname: '/sub/form', params: { id: d.id } })}
          style={({ pressed }) => [{ height: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: pressed ? C.lime : C.white, justifyContent: 'center' }, border(), shadow(3)]}>
          <T w={800} size={15}>✎ edit</T>
        </Pressable>
      </Rise>

      <PopIn delay={50}>
        <View style={[{ marginTop: 30, backgroundColor: d.color, borderRadius: 32, padding: 22, transform: [{ rotate: '-2deg' }] }, border(3), shadow(8)]}>
          <View style={[{ position: 'absolute', top: -16, left: '50%', marginLeft: -50, width: 100, height: 28, backgroundColor: '#FFE14DD9', transform: [{ rotate: '4deg' }] }, border(2)]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Letter name={d.name} color={C.white} size={72} fontSize={34} bw={3} />
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.ink }}>
              <T w={800} size={13} color={C.lime}>{active ? TYPES.find((t) => t[0] === d.type)![1] : 'cancelled'}</T>
            </View>
          </View>
          <T w={800} size={36} style={{ marginTop: 16, letterSpacing: -1.2, lineHeight: 38 }}>{d.name}</T>
          <T mono={500} size={18} style={{ marginTop: 6 }}>{priceLabel(d)}</T>
        </View>
      </PopIn>

      <Rise delay={120} style={{ marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={[{ paddingHorizontal: 18, paddingVertical: 4, borderRadius: 22, backgroundColor: C.ink, transform: [{ rotate: '2deg' }] }, shadow(5, C.pink)]}>
          <T w={800} size={72} color={C.lime} style={{ lineHeight: 78, letterSpacing: -2, fontVariant: ['tabular-nums'] }}>{String(Math.max(0, days)).padStart(2, '0')}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T w={800} size={20} style={{ lineHeight: 22 }}>
            {!active ? 'days till it would’ve hit' : d.type === 'free_trial' ? 'days left on trial' : d.type === 'expires' ? 'days till it expires' : 'days till it hits'}
          </T>
          <T mono size={13} style={{ marginTop: 4 }}>{fmtDay(d.next_date)}</T>
        </View>
      </Rise>
      <Rise delay={160} style={{ marginTop: 22, padding: 14, paddingHorizontal: 16, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.ink, borderRadius: 18 }}>
        <T w={700} size={17} style={{ lineHeight: 22 }}>{line(d)}</T>
      </Rise>

      <T mono size={12} style={{ marginTop: 24, marginBottom: 10, letterSpacing: 1 }}>REMINDERS</T>
      <View style={{ gap: 10 }}>
        {[...d.remind_days_before].sort((a, b) => b - a).map((r, i) => {
          const past = reminderAt(d.next_date, r, profile?.reminder_hour ?? 9).getTime() <= Date.now();
          return (
            <Rise key={r} delay={200 + i * 60} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white,
              opacity: active && !past ? 1 : 0.5 }, border(), shadow(3)]}>
              <View style={[{ width: 34, height: 34, borderRadius: 17, backgroundColor: PALETTE[(i + 2) % 7], alignItems: 'center', justifyContent: 'center' }, border()]}><T size={15}>🔔</T></View>
              <View style={{ flex: 1 }}>
                <T w={800} size={15}>{past ? 'already sent ✓' : `${fmtDay(addDays(d.next_date, -r))} · ${hourLabel(profile?.reminder_hour ?? 9)}`}</T>
                <T mono size={12}>{r === 0 ? 'day of' : `${r} day${r > 1 ? 's' : ''} before`}</T>
              </View>
              <T mono size={11}>{emails ? 'push + email' : 'push'}</T>
            </Rise>
          );
        })}
      </View>

      <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
        <View style={[{ flex: 1, padding: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white }, border()]}>
          <T mono size={11}>CATEGORY</T><T w={800} size={16}>{d.category ?? 'Other'}</T>
        </View>
        <View style={[{ flex: 1, padding: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white }, border()]}>
          <T mono size={11}>PER MONTH</T><T w={800} size={16}>{money(toMonthly(d, cur, true), cur)}</T>
        </View>
      </View>

      {!!d.notes && (
        <View style={[{ marginTop: 26, padding: 18, paddingTop: 20, paddingBottom: 16, backgroundColor: C.yellow, transform: [{ rotate: '1.5deg' }] }, border(), shadow(4)]}>
          <View style={[{ position: 'absolute', top: -12, left: 22, width: 70, height: 22, backgroundColor: '#FF7AC6CC', transform: [{ rotate: '-6deg' }] }, border(2)]} />
          <T w={600} size={16} style={{ lineHeight: 22 }}>{d.notes}</T>
        </View>
      )}

      <View style={{ marginTop: 28, gap: 12 }}>
        {!!d.portal_url && (
          <Btn title={`open ${d.portal_url.replace(/^https?:\/\//, '')} ↗`} onPress={() => Linking.openURL(d.portal_url!).catch(() => toast('couldn’t open that link'))} />
        )}
        <Btn kind="plain" title="✉️ preview the reminder email" h={54} size={15} onPress={() => router.push({ pathname: '/mail', params: { id: d.id } })} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Btn kind="plain" title={active ? 'mark cancelled' : 'revive it'} bg={C.yellow} h={54} size={15} style={{ flex: 1 }} onPress={toggleCancel} />
          <Btn kind="plain" title="delete" fg={C.redInk} h={54} size={15} style={{ flex: 1 }} onPress={() => setConfirm(true)} />
        </View>
      </View>

      <Confirm visible={confirm} title={`delete ${d.name}?`} body="this removes it and all its reminders. no undo." yes="delete" onYes={doDelete} onClose={() => setConfirm(false)} />
    </Screen>
  );
}

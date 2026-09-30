import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { useFx } from '../components/overlays';
import { Screen } from '../components/Screen';
import { Btn, Letter, RoundBtn, Rise, T } from '../components/ui';
import { useStore } from '../lib/store';
import { CYCLES, daysUntil, fmtDay, hourLabel, line, money, priceLabel, TYPES, when } from '../lib/subs';
import { border, C, shadow } from '../theme';

// In-app preview of the reminder email (same copy as supabase/functions/send-reminders).
export default function Mail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subs, profile, patch } = useStore();
  const { toast } = useFx();
  const s = subs.find((x) => x.id === id);
  if (!s) return <Redirect href="/" />;

  const rel = when(daysUntil(s.next_date));
  const date = fmtDay(s.next_date);
  const subject = s.type === 'free_trial' ? `⏳ your ${s.name} trial ends ${rel}` : s.type === 'expires' ? `⌛ ${s.name} expires ${rel}` : `⏰ ${s.name} renews ${rel}`;
  const msg = s.type === 'free_trial' ? `your free trial turns paid on ${date}. cancel before then if you don’t want the charge.`
    : s.type === 'expires' ? `this expires on ${date}. renew if you want to keep it, or let it go.`
    : `this renews automatically on ${date}. still using it? do nothing. if not, cancel before then.`;
  const rows = [['date', date], ['amount', money(s.price, s.currency)], ['type', TYPES.find((t) => t[0] === s.type)![1]], ['cycle', CYCLES.find((c) => c[0] === s.billing_cycle)![1]]];
  const portal = s.portal_url?.replace(/^https?:\/\//, '');

  async function unsubscribe() {
    try {
      const { queued } = await patch(s!.id, { email_enabled: false });
      toast(queued ? 'saved offline ✦ syncs when you’re back' : `no more emails about ${s!.name} ✓`);
    } catch {
      toast('couldn’t save that. try again');
    }
  }

  const linkText = (label: string, onPress: () => void, hoverColor = C.purple) => (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10}>{({ pressed }) => <T mono size={12} color={pressed ? hoverColor : C.ink} style={{ textDecorationLine: 'underline' }}>{label}</T>}</Pressable>
  );

  return (
    <Screen scroll bg="#F4F0E6" contentContainerStyle={{ paddingHorizontal: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 2, borderColor: '#14141422' }}>
        <RoundBtn size={44} />
        <T w={800} size={17} style={{ flex: 1 }}>inbox</T>
        <T mono size={12}>preview</T>
      </View>
      <Rise style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <T w={800} size={22} style={{ lineHeight: 25, letterSpacing: -0.5 }}>{subject}</T>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }, border()]}><T w={800} size={18}>S</T></View>
          <View>
            <T w={800} size={14}>SubTrack</T>
            <T mono size={12}>to {profile?.email ?? 'me'} · {hourLabel(profile?.reminder_hour ?? 9)}</T>
          </View>
        </View>
      </Rise>

      <Rise delay={80} style={[{ marginHorizontal: 14, marginTop: 12, backgroundColor: C.white, borderRadius: 22, overflow: 'hidden' }, border(), shadow(5)]}>
        <View style={{ backgroundColor: C.lime, borderBottomWidth: 2.5, borderColor: C.ink, paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><T w={800} size={15} color={C.lime}>S</T></View>
            <T w={800} size={17}>SubTrack</T>
          </View>
          <T mono size={11}>REMINDER</T>
        </View>
        <View style={{ padding: 18, paddingVertical: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Letter name={s.name} color={s.color} size={52} fontSize={24} />
            <View><T w={800} size={20}>{s.name}</T><T mono size={13}>{priceLabel(s)}</T></View>
          </View>
          <T w={800} size={26} style={{ marginTop: 18, lineHeight: 29, letterSpacing: -0.8 }}>{line(s)}</T>
          <T size={15} style={{ marginTop: 12, lineHeight: 22 }}>{msg}</T>
          <View style={{ marginTop: 16 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#14141433' }}>
                <T mono size={12}>{k}</T><T w={800} size={14}>{v}</T>
              </View>
            ))}
          </View>
          <Btn style={{ marginTop: 18 }} h={54} size={15} title={portal ? `manage at ${portal} ↗` : 'open in SubTrack →'}
            onPress={() => (s.portal_url ? Linking.openURL(s.portal_url) : router.replace({ pathname: '/sub/[id]', params: { id: s.id } }))} />
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <T size={13}>already cancelled?</T>
            <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.replace({ pathname: '/sub/[id]', params: { id: s.id } })}><T w={800} size={13} style={{ textDecorationLine: 'underline' }}>mark it in the app</T></Pressable>
          </View>
        </View>
        <View style={{ padding: 16, paddingHorizontal: 18, backgroundColor: C.cream, borderTopWidth: 2.5, borderColor: C.ink }}>
          <T mono size={12} style={{ lineHeight: 18 }}>you’re getting this because email reminders are on for {s.name}.</T>
          <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }}>
            {s.email_enabled ? linkText(`unsubscribe from ${s.name} emails`, unsubscribe, C.redInk) : <T mono size={12}>emails for {s.name} are off</T>}
            {linkText('reminder settings', () => router.navigate('/settings'))}
          </View>
          <T mono size={12} style={{ marginTop: 10 }}>SubTrack · sent with ♥</T>
        </View>
      </Rise>
    </Screen>
  );
}

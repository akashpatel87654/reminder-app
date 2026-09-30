import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, Share, View } from 'react-native';
import { NotifOffSheet, usePushOff, useTestNag } from '../../components/notif';
import { Confirm, useFx } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { Btn, Chip, Divider, Rise, T, Toggle } from '../../components/ui';
import { signOut } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { CURRENCIES, hourLabel, REMIND_OPTIONS, SYM, toCsv, toggleDay, upcoming } from '../../lib/subs';
import { supabase } from '../../lib/supabase';
import { border, C, shadow } from '../../theme';

const Row = ({ title, sub, right }: { title: string; sub: string; right: ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <View style={{ flex: 1 }}><T w={800} size={16}>{title}</T><T mono size={12}>{sub}</T></View>
    {right}
  </View>
);

export default function Settings() {
  const { profile, subs, notif, pushOn, setPushOn, setProfile } = useStore();
  const { toast } = useFx();
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const pushOff = usePushOff();
  const testPush = useTestNag(() => setSheet(true));
  if (!profile) return <Screen><View /></Screen>;

  const save = (p: Parameters<typeof setProfile>[0]) => setProfile(p).then(({ queued }) => queued && toast('saved offline ✦ syncs when you’re back'), () => toast('couldn’t save that. try again'));
  const hour = (d: number) => save({ reminder_hour: Math.min(22, Math.max(6, profile.reminder_hour + d)) });

  function togglePush() {
    if (notif === 'denied' || (pushOn && pushOff)) return setSheet(true);
    if (pushOn) {
      setPushOn(false);
      toast('push off. hope you like surprises 🙃');
    } else setSheet(true);
  }

  async function exportCsv() {
    try {
      await Share.share({ title: 'subtrack-export.csv', message: toCsv(subs) });
    } catch {
      toast('export failed. try again');
    }
  }

  async function deleteAccount() {
    setConfirm(false);
    const { error } = await supabase.rpc('delete_account');
    if (error) return toast('couldn’t delete. check your connection');
    await signOut();
    toast('account deleted. bye bestie 👋');
  }

  const firstUp = upcoming(subs)[0] ?? subs[0];
  const letter = (profile.email[0] ?? '?').toUpperCase();

  return (
    <Screen scroll bottom={130}>
      <Rise><T accessibilityRole="header" w={800} size={42} style={{ letterSpacing: -1.6, lineHeight: 44 }}>settings</T></Rise>
      <Rise delay={40}><T mono size={13} style={{ marginTop: 6 }}>tune how hard we nag you</T></Rise>

      <Rise delay={80} style={[{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: C.pink, borderRadius: 24, transform: [{ rotate: '-1deg' }] }, border(3), shadow(5)]}>
        <View style={[{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' }, border()]}>
          <T w={800} size={24}>{letter}</T>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w={800} size={18} numberOfLines={1}>{profile.email}</T>
          <T mono size={12}>{profile.timezone}</T>
        </View>
      </Rise>

      <Rise delay={120} style={[{ marginTop: 20, padding: 16, borderRadius: 22, backgroundColor: C.white }, border(), shadow(4)]}>
        <T w={800} size={16}>default reminders</T>
        <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REMIND_OPTIONS.map((r, i) => (
            <Chip key={r} i={i} h={38} size={13} label={r === 0 ? 'day of' : `${r}d`} on={profile.default_remind_days.includes(r)}
              onPress={() => save({ default_remind_days: toggleDay(profile.default_remind_days, r) })} />
          ))}
        </View>
        <Divider />
        <Row title="nag time" sub="your local time" right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StepBtn label="−" a11y="Earlier" onPress={() => hour(-1)} />
            <View style={[{ minWidth: 88, paddingVertical: 8, borderRadius: 12, backgroundColor: C.lime, alignItems: 'center' }, border()]}>
              <T mono={500} size={16}>{hourLabel(profile.reminder_hour)}</T>
            </View>
            <StepBtn label="+" a11y="Later" onPress={() => hour(1)} />
          </View>
        } />
        <Divider />
        <Row title="push notifications" sub={notif === 'denied' ? 'blocked by your phone' : pushOff ? 'off' : 'on for this phone'}
          right={<Toggle label="Push notifications" on={!pushOff} onPress={togglePush} />} />
        <Divider />
        <Row title="email reminders" sub="for every sub with email on"
          right={<Toggle label="Email reminders" on={profile.email_enabled} onPress={() => save({ email_enabled: !profile.email_enabled })} />} />
        <Divider />
        <T w={800} size={16}>currency</T>
        <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CURRENCIES.map((c, i) => <Chip key={c} i={i} h={38} size={13} label={`${SYM[c]} ${c}`} on={profile.currency === c} onPress={() => save({ currency: c })} />)}
        </View>
      </Rise>

      <Rise delay={140} style={[{ marginTop: 20, borderRadius: 22, backgroundColor: C.white, overflow: 'hidden' }, border(), shadow(4)]}>
        <LinkRow label="preview reminder email" hover={C.mint}
          onPress={() => (firstUp ? router.push({ pathname: '/mail', params: { id: firstUp.id } }) : toast('add a sub first'))} />
        <View style={{ height: 2, backgroundColor: C.ink, opacity: 0.12 }} />
        <LinkRow label="privacy policy" hover={C.pink} onPress={() => router.push('/privacy')} />
      </Rise>

      <Rise delay={160} style={{ marginTop: 20, gap: 12 }}>
        <Btn kind="plain" title="send me a test nag 🔔" bg={C.blueBtn} fg={C.white} h={56} size={16} onPress={testPush} />
        <Btn kind="plain" title="export all as CSV ↓" bg={C.lime} h={56} size={16} onPress={exportCsv} />
        <Btn kind="plain" title="log out" h={56} size={16} onPress={() => signOut().then(() => toast('logged out. see ya ✌︎'))} />
        <Pressable accessibilityRole="button" onPress={() => setConfirm(true)}
          style={({ pressed }) => ({ height: 56, borderRadius: 18, borderWidth: 2.5, borderColor: C.redInk, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.red : 'transparent' })}>
          {({ pressed }) => <T w={800} size={16} color={pressed ? C.white : C.redInk}>delete account</T>}
        </Pressable>
      </Rise>
      <T mono size={11} style={{ marginTop: 22, textAlign: 'center' }}>SubTrack v1.0 · made w/ ♥ & mild money anxiety</T>

      <NotifOffSheet visible={sheet} onClose={() => setSheet(false)} />
      <Confirm visible={confirm} title="nuke your account?" body="every sub, reminder and setting gets deleted forever. fr fr no undo." yes="delete it all"
        onYes={deleteAccount} onClose={() => setConfirm(false)} />
    </Screen>
  );
}

const StepBtn = ({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={6}
    style={({ pressed }) => [{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, border(),
      pressed ? { transform: [{ scale: 0.8 }] } : shadow(2)]}>
    <T w={800} size={18}>{label}</T>
  </Pressable>
);

const LinkRow = ({ label, hover, onPress }: { label: string; hover: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: pressed ? hover : 'transparent' })}>
    <T w={800} size={16}>{label}</T><T w={800} size={16}>→</T>
  </Pressable>
);

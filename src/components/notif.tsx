import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { pref, useStore } from '../lib/store';
import { testNag } from '../lib/reminders';
import { upcoming } from '../lib/subs';
import { C } from '../theme';
import { Sheet, Tile, useFx } from './overlays';
import { Btn, T } from './ui';

const STEPS = Platform.OS === 'ios'
  ? ['open settings', 'notifications → SubTrack', 'switch “allow notifications” on']
  : ['open android settings', 'apps → SubTrack → notifications', 'switch “allow notifications” on'];

// Push is effectively off when the OS blocks it or the user switched it off in settings.
export function usePushOff() {
  const { notif, pushOn } = useStore();
  return notif === 'denied' || !pushOn || (notif === 'undetermined' && pref.get('askedPerm') === '1');
}

// "send me a test nag" / the bell: fires a real local notification for the next sub due.
export function useTestNag(openSheet: () => void) {
  const { subs } = useStore();
  const { toast } = useFx();
  const off = usePushOff();
  return () => {
    if (off) return openSheet();
    const s = upcoming(subs)[0] ?? subs.find((x) => x.status === 'active');
    if (!s) return toast('add a sub first, then we can nag');
    if (Platform.OS === 'web') return toast('test nags only fire on a phone 📱');
    testNag(s);
  };
}

export function NotifOffSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { pushOn, setPushOn, requestNotif, checkNotif } = useStore();
  const { toast, confetti } = useFx();
  const blockedByOs = pushOn; // if the in-app toggle is on, the block must be the OS

  async function fix() {
    if (!pushOn) {
      setPushOn(true);
      const { state } = await checkNotif();
      if (state === 'granted') {
        onClose();
        confetti();
        return toast('notifs back on ✦ we got you');
      }
    }
    const { canAsk } = await checkNotif();
    if (canAsk && (await requestNotif())) {
      onClose();
      confetti();
      return toast('notifs back on ✦ we got you');
    }
    onClose();
    Linking.openSettings();
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Tile emoji="🔕" bg={C.paper} wiggle />
      <T accessibilityRole="header" w={800} size={34} style={{ marginTop: 20, letterSpacing: -1.2, lineHeight: 36 }}>notifs are off</T>
      <T size={16} style={{ marginTop: 10, lineHeight: 22 }}>
        {blockedByOs ? `${Platform.OS === 'ios' ? 'iOS' : 'android'} is blocking SubTrack, so we can’t ping you before charges.` : 'you switched push off, so we can’t ping you before charges.'} email reminders still work.
      </T>
      {blockedByOs && (
        <View style={{ marginTop: 18, gap: 10 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: [C.pink, C.lime, C.purple][i] }}>
                <T mono size={13}>{i + 1}</T>
              </View>
              <T w={700} size={15}>{s}</T>
            </View>
          ))}
        </View>
      )}
      <View style={{ marginTop: 22, gap: 6 }}>
        <Btn title={blockedByOs ? STEPS[0] : 'turn push back on'} onPress={fix} />
        <Btn kind="ghost" title="keep them off" h={48} size={15} onPress={onClose} />
      </View>
    </Sheet>
  );
}

// First run after login: ask nicely before the OS prompt.
export function PermSheet() {
  const { notif, status, subs, requestNotif } = useStore();
  const { toast, confetti } = useFx();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (status === 'ready' && notif === 'undetermined' && pref.get('askedPerm') !== '1' && Platform.OS !== 'web') {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [status, notif]);

  const done = () => {
    pref.set('askedPerm', '1');
    setOpen(false);
  };
  async function allow() {
    done();
    if (await requestNotif()) {
      confetti();
      toast('notifs on ✦ we only nag when it matters');
      const s = upcoming(subs)[0];
      if (s) setTimeout(() => testNag(s), 2200);
    }
  }

  return (
    <Sheet visible={open} onClose={done}>
      <Tile emoji="🔔" bg={C.yellow} size={96} rot={-6} wiggle />
      <T accessibilityRole="header" w={800} size={34} style={{ marginTop: 22, letterSpacing: -1.2, lineHeight: 36 }}>can we nag you?</T>
      <T size={16} style={{ marginTop: 12, lineHeight: 22 }}>one ping a couple days before anything charges. that’s it. no spam, pinky promise.</T>
      <View style={{ marginTop: 24, gap: 10 }}>
        <Btn title="yes, nag me" size={18} onPress={allow} />
        <Btn kind="ghost" title="maybe later" h={50} size={15} onPress={done} />
      </View>
    </Sheet>
  );
}

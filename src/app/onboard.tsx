import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Btn, Loop, T } from '../components/ui';
import { pref } from '../lib/store';
import { border, C, shadow } from '../theme';

const CARDS = [
  { emoji: '👀', color: C.pink, tag: 'all in one place', title: 'see every sub in one place', body: 'trials, renewals, that gym you forgot about. all sorted by what hits next.', rot: '-2deg' },
  { emoji: '🔔', color: C.lime, tag: '9 AM · 2 days before', title: 'we nag before it charges', body: 'one ping a couple days before. email backup in case you mute us.', rot: '2deg' },
  { emoji: '💸', color: C.purple, tag: 'cancel the dead weight', title: 'keep your money', body: 'see what you actually spend a month and drop what you don’t use.', rot: '-1.5deg' },
];

export default function Onboard() {
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [h, setH] = useState(0); // pages need an explicit height inside a horizontal pager
  const scroller = useRef<ScrollView>(null);
  const finish = () => {
    pref.set('onboarded', '1');
    router.replace('/login');
  };
  const next = () => (idx < 2 ? scroller.current?.scrollTo({ x: (idx + 1) * width, animated: true }) : finish());

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.lime }, border(2)]} />
          <T mono={500} size={13}>SubTrack</T>
        </View>
        <Pressable onPress={finish} style={({ pressed }) => [{ height: 38, paddingHorizontal: 16, borderRadius: 999, backgroundColor: pressed ? C.yellow : C.white, justifyContent: 'center' }, border(2)]}>
          <T w={700} size={14}>skip</T>
        </Pressable>
      </View>

      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flex: 1, marginTop: 18 }} onLayout={(e) => setH(e.nativeEvent.layout.height)}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        onScroll={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))} scrollEventThrottle={64}>
        {CARDS.map((c, i) => (
          <View key={c.tag} style={{ width, height: h, paddingHorizontal: 24, paddingTop: 12 }}>
            <View style={[{ flex: 1, backgroundColor: c.color, borderRadius: 36, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: c.rot }, { scale: i === idx ? 1 : 0.9 }] }, border(3), shadow(8)]}>
              <View style={[{ position: 'absolute', top: 20, left: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.white, transform: [{ rotate: '-5deg' }] }, border()]}>
                <T w={800} size={13}>{c.tag}</T>
              </View>
              <Loop kind="bob">
                <View style={[{ width: 150, height: 150, borderRadius: 75, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, border(3), shadow(5)]}>
                  <T size={76}>{c.emoji}</T>
                </View>
              </Loop>
              <T mono size={13} style={{ position: 'absolute', bottom: 18, right: 22 }}>0{i + 1} / 03</T>
            </View>
            <T w={800} size={36} style={{ marginTop: 28, lineHeight: 37, letterSpacing: -1.4 }}>{c.title}</T>
            <T size={16} style={{ marginTop: 10, lineHeight: 22 }}>{c.body}</T>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 36 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {CARDS.map((_, i) => <View key={i} style={[{ height: 12, width: i === idx ? 32 : 12, borderRadius: 9, backgroundColor: i === idx ? C.lime : C.white }, border(2)]} />)}
        </View>
        <Btn title={idx < 2 ? 'next →' : 'let’s go ✦'} h={56} onPress={next} />
      </View>
    </Screen>
  );
}

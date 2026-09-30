import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Screen } from '../components/Screen';
import { PopIn, RoundBtn, Rise, T } from '../components/ui';
import { useStore } from '../lib/store';
import { money, toMonthly } from '../lib/subs';
import { border, C, PALETTE, shadow } from '../theme';

// Bar that grows from the left, like the design's `grow` keyframe.
function Grow({ pct, color, delay, edge }: { pct: number; color: string; delay: number; edge?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 850, delay, easing: Easing.bezier(0.2, 1.2, 0.4, 1), useNativeDriver: false }).start();
  }, [v, delay]);
  return <Animated.View style={{ height: '100%', backgroundColor: color, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }),
    borderRightWidth: edge ? 2.5 : 0, borderColor: C.ink }} />;
}

export default function Stats() {
  const { subs, profile } = useStore();
  const cur = profile?.currency ?? 'INR';
  const total = subs.reduce((a, s) => a + toMonthly(s, cur), 0);

  const cats: Record<string, { v: number; n: number }> = {};
  for (const s of subs) {
    const v = toMonthly(s, cur);
    if (v <= 0) continue;
    const k = s.category ?? 'Other';
    cats[k] = { v: (cats[k]?.v ?? 0) + v, n: (cats[k]?.n ?? 0) + 1 };
  }
  const list = Object.entries(cats).sort((a, b) => b[1].v - a[1].v);
  const top = [...subs].sort((a, b) => toMonthly(b, cur) - toMonthly(a, cur))[0];

  return (
    <Screen scroll>
      <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RoundBtn />
        <T w={800} size={22} style={{ letterSpacing: -0.5 }}>where it goes</T>
        <View style={{ width: 48 }} />
      </Rise>
      <Rise delay={50}><T mono size={13} style={{ marginTop: 24 }}>monthly burn</T></Rise>
      <Rise delay={80}><T w={800} size={54} adjustsFontSizeToFit numberOfLines={1} style={{ letterSpacing: -2.4, lineHeight: 58 }}>{money(total, cur)}</T></Rise>
      <Rise delay={100}><T w={600} size={15}>that’s {money(total * 12, cur)} a year</T></Rise>

      <View style={[{ marginTop: 18, flexDirection: 'row', height: 46, borderRadius: 16, overflow: 'hidden', backgroundColor: C.white }, border(3), shadow(5)]}>
        {list.map(([k, o], i) => (
          <View key={k} style={{ width: `${(o.v / total) * 100}%`, height: '100%' }}>
            <Grow pct={100} color={PALETTE[i % 7]} delay={100 + i * 80} edge={i < list.length - 1} />
          </View>
        ))}
      </View>

      {top && toMonthly(top, cur) > 0 && (
        <PopIn delay={350}>
          <View style={[{ marginTop: 24, padding: 14, paddingHorizontal: 16, backgroundColor: C.yellow, borderRadius: 18, transform: [{ rotate: '1.2deg' }] }, border(), shadow(4)]}>
            <T w={700} size={16} style={{ lineHeight: 21 }}>{top.name} is your biggest bite at {money(toMonthly(top, cur), cur)}/mo 🍕</T>
          </View>
        </PopIn>
      )}

      <T mono size={12} style={{ marginTop: 26, marginBottom: 10, letterSpacing: 1 }}>BY CATEGORY</T>
      {list.map(([k, o], i) => (
        <Rise key={k} delay={150 + i * 70} style={[{ marginBottom: 12, padding: 14, borderRadius: 18, backgroundColor: C.white }, border(), shadow(3)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[{ width: 18, height: 18, borderRadius: 9, backgroundColor: PALETTE[i % 7] }, border(2)]} />
            <T w={800} size={16} style={{ flex: 1 }}>{k}</T>
            <T mono={500} size={14}>{money(o.v, cur)}/mo</T>
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[{ flex: 1, height: 12, borderRadius: 9, overflow: 'hidden', backgroundColor: C.cream }, border(2)]}>
              <Grow pct={(o.v / list[0][1].v) * 100} color={PALETTE[i % 7]} delay={150 + i * 70} />
            </View>
            <T mono size={12} style={{ minWidth: 92, textAlign: 'right' }}>{Math.round((o.v / total) * 100)}% · {o.n} sub{o.n > 1 ? 's' : ''}</T>
          </View>
        </Rise>
      ))}
      {!list.length && <T w={700} size={16} style={{ marginTop: 8 }}>nothing recurring yet. add a sub to see the breakdown.</T>}
    </Screen>
  );
}

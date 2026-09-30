import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ErrorView, Marquee } from '../../components/overlays';
import { NotifOffSheet, PermSheet, usePushOff, useTestNag } from '../../components/notif';
import { Screen } from '../../components/Screen';
import { Btn, Letter, Loop, Pill, Rise, T } from '../../components/ui';
import { useStore } from '../../lib/store';
import { badge, convert, kind, money, priceLabel, toMonthly, upcoming } from '../../lib/subs';
import { border, C, shadow, TILT } from '../../theme';

// Eases the big number from its last value to the new one.
function useCountUp(to: number) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current, t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / 900), v = start + (to - start) * (1 - Math.pow(1 - k, 4));
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return shown;
}

export default function Home() {
  const { subs, profile, status, offline, refresh } = useStore();
  const [period, setPeriod] = useState<'mo' | 'yr'>('mo');
  const [sheet, setSheet] = useState(false);
  const pushOff = usePushOff();
  const testPush = useTestNag(() => setSheet(true));

  const cur = profile?.currency ?? 'INR';
  const monthly = subs.reduce((a, s) => a + toMonthly(s, cur), 0);
  const total = period === 'mo' ? monthly : monthly * 12;
  const shown = useCountUp(total);
  const up = upcoming(subs);
  const active = subs.filter((s) => s.status === 'active').length;
  const userName = (profile?.email.split('@')[0] ?? '').slice(0, 14) || 'hey';

  if (status === 'error') return <Screen><ErrorView onRetry={refresh} /></Screen>;
  if (status === 'loading') return <Screen><View /></Screen>;

  return (
    <Screen scroll bottom={130}>
      <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable accessibilityLabel="Settings" onPress={() => router.navigate('/settings')}
            style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.88 : 1 }] }, border(), shadow(3)]}>
            <T w={800} size={20}>{userName[0].toUpperCase()}</T>
          </Pressable>
          <View>
            <T mono size={12}>gm ✦</T>
            <T w={800} size={22} style={{ letterSpacing: -0.5 }}>{userName}</T>
          </View>
        </View>
        <Pressable accessibilityLabel="Send a test reminder" onPress={testPush}
          style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, border(),
            pressed ? { transform: [{ translateX: 3 }, { translateY: 3 }] } : shadow(3)]}>
          <Loop kind="wiggle"><T size={22}>🔔</T></Loop>
          <View style={[{ position: 'absolute', top: -8, right: -8, minWidth: 22, height: 22, paddingHorizontal: 4, borderRadius: 11, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }, border(2)]}>
            <T w={800} size={12} color={C.white}>{up.length}</T>
          </View>
        </Pressable>
      </Rise>

      {pushOff && (
        <Rise delay={40}>
          <Pressable onPress={() => setSheet(true)} style={({ pressed }) => [{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, backgroundColor: C.orange, borderRadius: 18 }, border(),
            pressed ? { transform: [{ translateX: 4 }, { translateY: 4 }] } : shadow(4)]}>
            <View style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, border()]}>
              <Loop kind="wiggle" duration={2400}><T size={17}>🔕</T></Loop>
            </View>
            <View style={{ flex: 1 }}>
              <T w={800} size={15}>notifs are off 😬</T>
              <T size={13}>you might miss a charge</T>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.ink }}><T w={800} size={13} color={C.lime}>fix it</T></View>
          </Pressable>
        </Rise>
      )}

      {offline && (
        <Rise style={[{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, backgroundColor: C.ink, borderRadius: 18 }, border(), shadow(4, C.orange)]}>
          <Loop kind="pulse" duration={1200}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.red }} /></Loop>
          <T w={600} size={14} color={C.white} style={{ flex: 1, lineHeight: 18 }}>you’re offline. changes save on this phone and sync when you’re back.</T>
        </Rise>
      )}

      {subs.length > 0 ? (
        <>
          <Rise delay={60}>
            <View style={[{ marginTop: 22, backgroundColor: C.lime, borderRadius: 28, padding: 20, paddingTop: 18, transform: [{ rotate: '-1.2deg' }] }, border(3), shadow(6)]}>
              <Loop kind="spin" duration={7000} style={{ position: 'absolute', top: -20, right: 18 }}>
                <View style={[{ width: 62, height: 62, borderRadius: 31, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' }, border(3)]}><T size={30}>✦</T></View>
              </Loop>
              <PeriodToggle period={period} onChange={setPeriod} />
              <T mono size={13} style={{ marginTop: 18 }}>you’re spending</T>
              <T w={800} size={58} adjustsFontSizeToFit numberOfLines={1} style={{ letterSpacing: -2.5, lineHeight: 62, fontVariant: ['tabular-nums'] }}>{money(shown, cur)}</T>
              <T w={600} size={15}>{period === 'mo' ? 'a month' : 'a year'} across {active} subs</T>
              <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <View style={[{ backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }, border(2)]}>
                  <T w={700} size={13}>≈ {Math.round(convert(total, cur, 'USD') / 5.5)} iced lattes ☕</T>
                </View>
                <Pressable accessibilityRole="button" onPress={() => router.push('/stats')} hitSlop={6} style={({ pressed }) => [{ height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.ink, justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }, border(2)]}>
                  <T w={800} size={13} color={C.lime}>breakdown →</T>
                </Pressable>
              </View>
            </View>
          </Rise>

          <Rise delay={120}>
            <Marquee text={up.length ? up.map((s) => `${s.name.toUpperCase()} · ${badge(s).text.toUpperCase()}`).join('   ✦   ') + '   ✦   ' : 'ALL CLEAR THIS WEEK   ✦   NO SURPRISE CHARGES   ✦   '} />
          </Rise>

          <Rise delay={160} style={{ marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T w={800} size={26} style={{ letterSpacing: -0.8 }}>next 7 days</T>
              <View style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] }, border()]}>
                <T w={800} size={14}>{up.length}</T>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.navigate('/subs')} hitSlop={6} style={({ pressed }) => [{ height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: pressed ? C.pink : C.white, justifyContent: 'center' }, border(2)]}>
              <T w={700} size={13}>see all →</T>
            </Pressable>
          </Rise>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={184} decelerationRate="fast"
            style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22 }}>
            {up.map((s, i) => {
              const b = badge(s);
              return (
                <Rise key={s.id} delay={200 + i * 80}>
                  <Pressable onPress={() => router.push({ pathname: '/sub/[id]', params: { id: s.id } })}
                    style={({ pressed }) => [{ width: 168, height: 200, backgroundColor: s.color, borderRadius: 26, padding: 14, justifyContent: 'space-between',
                      transform: pressed ? [{ scale: 0.93 }] : [{ rotate: `${TILT[i % 6]}deg` }] }, border(3), pressed ? {} : shadow(5)]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Letter name={s.name} color={C.white} size={44} />
                      <Pill text={b.text} bg={b.bg} fg={b.fg} pulse={b.hot} />
                    </View>
                    <View>
                      <T mono size={11}>{kind(s)}</T>
                      <T w={800} size={20} numberOfLines={2} style={{ lineHeight: 21, letterSpacing: -0.4 }}>{s.name}</T>
                      <T mono={500} size={14} style={{ marginTop: 4 }}>{priceLabel(s)}</T>
                    </View>
                  </Pressable>
                </Rise>
              );
            })}
            {!up.length && (
              <View style={{ width: 320, padding: 24, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.ink, borderRadius: 24 }}>
                <T w={700} size={16} style={{ textAlign: 'center' }}>nothing due this week. go touch grass 🌱</T>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <Empty />
      )}

      <PermSheet />
      <NotifOffSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}

function PeriodToggle({ period, onChange }: { period: 'mo' | 'yr'; onChange: (p: 'mo' | 'yr') => void }) {
  return (
    <View style={[{ flexDirection: 'row', width: 176, height: 40, borderRadius: 999, backgroundColor: C.white, padding: 3 }, border()]}>
      {(['mo', 'yr'] as const).map((p) => (
        <Pressable key={p} accessibilityRole="button" accessibilityState={{ selected: period === p }} onPress={() => onChange(p)}
          style={{ flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: period === p ? C.ink : 'transparent' }}>
          <T w={800} size={14} color={period === p ? C.lime : C.ink}>{p === 'mo' ? 'monthly' : 'yearly'}</T>
        </Pressable>
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={{ marginTop: 28, alignItems: 'center' }}>
      <Rise delay={60} style={{ width: 260, height: 220 }}>
        <View style={{ position: 'absolute', left: 14, top: 24, width: 160, height: 170, borderWidth: 3, borderStyle: 'dashed', borderColor: C.ink, borderRadius: 28, transform: [{ rotate: '-12deg' }] }} />
        <View style={{ position: 'absolute', left: 90, top: 8, width: 160, height: 170, borderWidth: 3, borderStyle: 'dashed', borderColor: C.ink, borderRadius: 28, backgroundColor: C.white, transform: [{ rotate: '9deg' }] }} />
        <View style={[{ position: 'absolute', left: 50, top: 30, width: 160, height: 170, borderRadius: 28, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-2deg' }] }, border(3), shadow(6)]}>
          <Loop kind="bob" duration={2600}><T w={800} size={88}>?</T></Loop>
        </View>
      </Rise>
      <Rise delay={120}><T w={800} size={34} style={{ marginTop: 22, letterSpacing: -1.2, textAlign: 'center' }}>zero subs. suspicious.</T></Rise>
      <Rise delay={160}><T size={16} style={{ marginTop: 10, maxWidth: 290, lineHeight: 22, textAlign: 'center' }}>add your first one and we’ll start counting what you spend.</T></Rise>
      <Rise delay={200} style={{ marginTop: 24, alignSelf: 'stretch' }}>
        <Btn title="add your first sub +" size={18} onPress={() => router.push('/sub/form')} />
      </Rise>
    </View>
  );
}

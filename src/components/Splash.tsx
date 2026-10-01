import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { border, C, shadow } from '../theme';
import { Loop, PopIn, Rise, T } from './ui';

// Branded intro on cold start (the native splash is the plain lime version of this).
export function Splash() {
  const [done, setDone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const close = () => Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setDone(true));
  useEffect(() => {
    const t = setTimeout(close, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (done) return null;
  return (
    <Animated.View style={{ position: 'absolute', inset: 0, opacity: fade }}>
      <Pressable accessibilityLabel="Skip intro" onPress={close} style={{ flex: 1, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Loop kind="bob" duration={3400} style={{ position: 'absolute', left: -50, top: 90 }}>
          <View style={[{ width: 150, height: 150, borderRadius: 75, backgroundColor: C.pink }, border(3)]} />
        </Loop>
        <Loop kind="bob" duration={3000} delay={600} style={{ position: 'absolute', right: -40, bottom: 120 }}>
          <View style={[{ width: 130, height: 130, borderRadius: 36, backgroundColor: C.purple, transform: [{ rotate: '14deg' }] }, border(3)]} />
        </Loop>
        <PopIn delay={100}>
          <View style={[{ width: 148, height: 148, borderRadius: 42, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, border(3), shadow(8, C.pink)]}>
            <T w={800} size={96} color={C.lime} style={{ letterSpacing: -4, lineHeight: 110 }}>P</T>
          </View>
          {/* The "ping": a notification dot on the P, pulsing. */}
          <Loop kind="pulse" duration={1300} style={{ position: 'absolute', top: -12, right: -12 }}>
            <View style={[{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.pink }, border(3)]} />
          </Loop>
          <PopIn delay={750} style={{ position: 'absolute', bottom: -14, left: -24 }}>
            <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.red, transform: [{ rotate: '-10deg' }] }, border()]}>
              <T w={800} size={13} color={C.white}>in 2d</T>
            </View>
          </PopIn>
        </PopIn>
        <Rise delay={450} style={{ marginTop: 34 }}><T w={800} size={46} style={{ letterSpacing: -2 }}>Pingo</T></Rise>
        <Rise delay={550} style={{ marginTop: 6 }}><T mono size={13}>subscriptions, handled.</T></Rise>
      </Pressable>
    </Animated.View>
  );
}

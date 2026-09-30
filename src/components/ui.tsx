import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated, Easing, Pressable, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type ViewStyle,
} from 'react-native';
import { border, C, F, shadow } from '../theme';

type W = 500 | 600 | 700 | 800;

// Custom fonts ignore fontWeight on Android, so weight picks the font file.
export function T({ w = 500, mono, size = 16, color = C.ink, style, ...p }:
  TextProps & { w?: W; mono?: boolean | 500; size?: number; color?: string }) {
  const fontFamily = mono ? (mono === 500 ? F.mono500 : F.mono) : F[w];
  return <Text {...p} style={[{ fontFamily, fontSize: size, color }, style]} />;
}

export const Label = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ marginTop: 18, marginBottom: 8 }, style]}>
    <T mono size={12} style={{ letterSpacing: 1 }}>{children}</T>
  </View>
);

type BtnProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  kind?: 'primary' | 'plain' | 'ghost';
  bg?: string;
  fg?: string;
  h?: number;
  size?: number;
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
};

// The design's chunky button: hard shadow that collapses as the button "presses in".
export function Btn({ title, kind = 'primary', bg, fg, h = 58, size = 17, shadowColor, style, disabled, ...p }: BtnProps) {
  const primary = kind === 'primary';
  const ghost = kind === 'ghost';
  const sh = shadowColor ?? (primary ? C.pink : C.ink);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...p}
      style={({ pressed }) => [
        {
          height: h, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18,
          backgroundColor: bg ?? (primary ? C.ink : ghost ? 'transparent' : C.white),
          opacity: disabled ? 0.5 : 1,
        },
        !ghost && border(),
        !ghost && (pressed ? { transform: [{ translateX: 4 }, { translateY: 4 }], boxShadow: `0 0 0 ${sh}` } : shadow(4, sh)),
        ghost && pressed && { transform: [{ scale: 0.92 }] },
        style,
      ]}>
      <T w={800} size={size} color={fg ?? (primary ? C.lime : C.ink)} style={ghost ? { textDecorationLine: 'underline' } : undefined}>
        {title}
      </T>
    </Pressable>
  );
}

export function RoundBtn({ label = '←', onPress, bg = C.white, size = 48 }: { label?: string; onPress?: () => void; bg?: string; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label === '←' ? 'Back' : label}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        border(), pressed ? { transform: [{ scale: 0.85 }] } : shadow(3)]}>
      <T w={800} size={20}>{label}</T>
    </Pressable>
  );
}

// Toggle chip (design's chip()): black + lime when on, tilted a little.
export function Chip({ label, on, onPress, i = 0, h = 40, size = 14 }: { label: string; on: boolean; onPress: () => void; i?: number; h?: number; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [{ height: h, paddingHorizontal: 15, borderRadius: 999, justifyContent: 'center', backgroundColor: on ? C.ink : C.white },
        border(), on ? shadow(3, C.pink) : shadow(2),
        { transform: [...(on ? [{ rotate: `${i % 2 ? 2 : -2}deg` }, { scale: 1.06 }] : []), ...(pressed ? [{ scale: 0.9 }] : [])] }]}>
      <T w={700} size={size} color={on ? C.lime : C.ink}>{label}</T>
    </Pressable>
  );
}

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: on ? 1 : 0, useNativeDriver: false, friction: 5 }).start();
  }, [on, x]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={onPress} hitSlop={8}
      style={[{ width: 60, height: 34, borderRadius: 999, backgroundColor: on ? C.lime : C.paper }, border()]}>
      <Animated.View style={[{ position: 'absolute', top: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: C.white,
        left: x.interpolate({ inputRange: [0, 1], outputRange: [2, 28] }) }, border()]} />
    </Pressable>
  );
}

export function Letter({ name, color, size = 46, fontSize = 20, bw = 2.5 }: { name: string; color: string; size?: number; fontSize?: number; bw?: number }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }, border(bw)]}>
      <T w={800} size={fontSize}>{(name.trim()[0] || '?').toUpperCase()}</T>
    </View>
  );
}

export function Pill({ text, bg = C.white, fg = C.ink, pulse, style }: { text: string; bg?: string; fg?: string; pulse?: boolean; style?: StyleProp<ViewStyle> }) {
  const inner = (
    <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg }, border(2), style]}>
      <T w={800} size={12} color={fg}>{text}</T>
    </View>
  );
  return pulse ? <Loop kind="pulse" duration={1300}>{inner}</Loop> : inner;
}

export const Field = ({ style, ...p }: TextInputProps) => (
  <TextInput placeholderTextColor={C.placeholder} {...p}
    style={[{ height: 56, borderRadius: 16, paddingHorizontal: 16, fontFamily: F[600], fontSize: 18, color: C.ink, backgroundColor: C.white }, border(), shadow(4), style]} />
);

export const Divider = () => <View style={{ height: 2, backgroundColor: C.ink, opacity: 0.12, marginVertical: 16 }} />;

// ---- motion -------------------------------------------------------------

// Entrance: fade + rise + slight scale-up, like the design's `rise` keyframe.
const hide = (h?: boolean) => (h ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const } : {});

// `hidden`: purely decorative, skipped by screen readers.
export function Rise({ delay = 0, children, style, hidden }: { delay?: number; children: ReactNode; style?: StyleProp<ViewStyle>; hidden?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 500, delay, easing: Easing.bezier(0.2, 1.3, 0.4, 1), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View {...hide(hidden)} style={[style, {
      opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
    }]}>{children}</Animated.View>
  );
}

export function PopIn({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [v, delay]);
  return <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>{children}</Animated.View>;
}

type LoopKind = 'bob' | 'floaty' | 'spin' | 'wiggle' | 'pulse' | 'nudge';

// Infinite decorative loops: bob, floaty, spin, wiggle, pulse, nudge.
export function Loop({ kind, duration = 3000, delay = 0, children, style, hidden }: { kind: LoopKind; duration?: number; delay?: number; children: ReactNode; style?: StyleProp<ViewStyle>; hidden?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: kind === 'spin' ? Easing.linear : Easing.inOut(Easing.ease), useNativeDriver: true }));
    const t = setTimeout(() => anim.start(), delay);
    return () => { clearTimeout(t); anim.stop(); };
  }, [v, duration, delay, kind]);
  const wave = (a: number) => v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, a, 0] });
  const transform =
    kind === 'bob' ? [{ translateY: wave(-12) }]
    : kind === 'floaty' ? [{ translateY: wave(-5) }]
    : kind === 'nudge' ? [{ translateX: wave(-6) }]
    : kind === 'pulse' ? [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] }) }]
    : kind === 'spin' ? [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
    : [{ rotate: v.interpolate({ inputRange: [0, 0.8, 0.84, 0.88, 0.92, 0.96, 1], outputRange: ['0deg', '0deg', '-16deg', '14deg', '-10deg', '6deg', '0deg'] }) }];
  return <Animated.View {...hide(hidden)} style={[style, { transform }]}>{children}</Animated.View>;
}

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, C, PALETTE, shadow } from '../theme';
import { Btn, Loop, PopIn, T } from './ui';

// ---- toast + confetti ---------------------------------------------------

type Fx = { toast: (msg: string) => void; confetti: () => void; setToastLift: (lift: boolean) => void };
const FxContext = createContext<Fx>({ toast: () => {}, confetti: () => {}, setToastLift: () => {} });
export const useFx = () => useContext(FxContext);

export function FxProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const [lift, setToastLift] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const toast = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMsg({ text, key: Date.now() });
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  const confetti = useCallback(() => setBurst(Date.now()), []);

  return (
    <FxContext.Provider value={{ toast, confetti, setToastLift }}>
      {children}
      {burst > 0 && <Confetti key={burst} />}
      {msg && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + (lift ? 108 : 40), alignItems: 'center' }}>
          <PopIn key={msg.key}>
            <View style={[{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.ink }, border(), shadow(4, C.lime)]}>
              <T w={700} size={14} color={C.white} style={{ textAlign: 'center' }}>{msg.text}</T>
            </View>
          </PopIn>
        </View>
      )}
    </FxContext.Provider>
  );
}

function Confetti() {
  const { width: W, height: H } = Dimensions.get('window');
  const pieces = useRef(Array.from({ length: 40 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, v = 110 + Math.random() * 200, sz = 6 + Math.random() * 9;
    return { i, sz, round: i % 3 === 0, flat: i % 3 === 2, dx: Math.cos(a) * v, dy: Math.sin(a) * v - 110, rot: Math.random() * 900, t: new Animated.Value(0), dur: 1400 + Math.random() * 700 };
  })).current;
  useEffect(() => {
    Animated.parallel(pieces.map((p) => Animated.timing(p.t, { toValue: 1, duration: p.dur, easing: Easing.bezier(0.2, 0.7, 0.4, 1), useNativeDriver: true }))).start();
  }, [pieces]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {pieces.map((p) => (
        <Animated.View key={p.i} style={{
          position: 'absolute', left: W / 2, top: H * 0.42, width: p.sz, height: p.flat ? p.sz * 0.45 : p.sz,
          backgroundColor: PALETTE[p.i % 7], borderWidth: 1.5, borderColor: C.ink, borderRadius: p.round ? p.sz : 2,
          opacity: p.t.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateX: p.t.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, p.dx, p.dx * 1.2] }) },
            { translateY: p.t.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, p.dy, p.dy + 340] }) },
            { rotate: p.t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            { scale: p.t.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 0.8] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ---- bottom sheet -------------------------------------------------------

export function Sheet({ visible, onClose, children, handle }: { visible: boolean; onClose?: () => void; children: ReactNode; handle?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" style={{ position: 'absolute', inset: 0, backgroundColor: C.scrim }} onPress={onClose} />
        <View style={{ backgroundColor: C.cream, borderTopWidth: 3, borderColor: C.ink, borderTopLeftRadius: 32, borderTopRightRadius: 32,
          paddingHorizontal: 24, paddingTop: handle ? 14 : 30, paddingBottom: insets.bottom + 28 }}>
          {handle && <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: C.ink, alignSelf: 'center', marginBottom: 14 }} />}
          {children}
        </View>
      </View>
    </Modal>
  );
}

// Big emoji tile used at the top of sheets and full-screen states.
export function Tile({ emoji, bg, size = 92, rot = 6, wiggle }: { emoji: string; bg: string; size?: number; rot?: number; wiggle?: boolean }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${rot}deg` }] }, border(3), shadow(5)]}>
      {wiggle ? <Loop kind="wiggle" duration={2000}><T size={size / 2}>{emoji}</T></Loop> : <T size={size / 2}>{emoji}</T>}
    </View>
  );
}

// ---- confirm ------------------------------------------------------------

export function Confirm({ visible, title, body, yes, onYes, onClose }: { visible: boolean; title: string; body: string; yes: string; onYes: () => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: '#14141480', justifyContent: 'center', paddingHorizontal: 28 }} onPress={onClose}>
        <PopIn>
          <Pressable style={[{ padding: 22, paddingTop: 26, backgroundColor: C.white, borderRadius: 28 }, border(3), shadow(8, C.red)]}>
            <T size={48}>🫠</T>
            <T w={800} size={26} style={{ marginTop: 10, letterSpacing: -0.8, lineHeight: 28 }}>{title}</T>
            <T size={15} style={{ marginTop: 10, lineHeight: 21 }}>{body}</T>
            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
              <Btn kind="plain" title="nvm" h={50} size={15} style={{ flex: 1, borderRadius: 16 }} onPress={onClose} />
              <Btn kind="plain" title={yes} h={50} size={15} bg={C.red} fg={C.white} style={{ flex: 1, borderRadius: 16 }} onPress={onYes} />
            </View>
          </Pressable>
        </PopIn>
      </Pressable>
    </Modal>
  );
}

// ---- marquee ------------------------------------------------------------

export function Marquee({ text }: { text: string }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const a = Animated.loop(Animated.timing(x, { toValue: -w, duration: w * 22, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [w, x]);
  return (
    <View accessible accessibilityLabel={text.replace(/\s*✦\s*/g, '. ')} style={{ marginHorizontal: -24, marginTop: 30, backgroundColor: C.ink, paddingVertical: 12, overflow: 'hidden', transform: [{ rotate: '1.6deg' }] }}>
      <Animated.View style={{ flexDirection: 'row', width: 10000, transform: [{ translateX: x }] }}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row' }}>
          <T mono={500} size={13} color={C.lime} style={{ paddingRight: 24 }}>{text}</T>
        </View>
        <T mono={500} size={13} color={C.lime} style={{ paddingRight: 24 }}>{text}</T>
        <T mono={500} size={13} color={C.lime} style={{ paddingRight: 24 }}>{text}</T>
      </Animated.View>
    </View>
  );
}

// ---- full-screen network error ------------------------------------------

export function ErrorView({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: C.cream }}>
      <PopIn><Tile emoji="📡" bg={C.orange} size={120} wiggle /></PopIn>
      <T accessibilityRole="header" w={800} size={40} style={{ marginTop: 28, letterSpacing: -1.5, lineHeight: 42 }}>no signal, no magic</T>
      <T size={17} style={{ marginTop: 12, lineHeight: 24 }}>we couldn’t reach our servers. check your wifi or data, then try again.</T>
      <View style={{ marginTop: 28, gap: 12 }}>
        <Btn title="try again ↻" onPress={onRetry} />
        {onBack && <Btn kind="plain" title="go back" onPress={onBack} />}
      </View>
    </View>
  );
}


import { router, Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFx } from '../../components/overlays';
import { Loop, T } from '../../components/ui';
import { border, C, shadow } from '../../theme';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const SLOTS: Record<string, number> = { index: 0, subs: 1, settings: 3 };
const LABELS: Record<string, string> = { index: 'home', subs: 'subs', settings: 'me' };

function NavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const slot = SLOTS[state.routes[state.index].name] ?? 0;
  const x = useRef(new Animated.Value(slot)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: slot, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [slot, x]);
  const col = w / 4;

  const tab = (name: string) => {
    const on = state.routes[state.index].name === name;
    return (
      <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => navigation.navigate(name)}
        style={({ pressed }) => ({ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.85 : 1 }] })}>
        <T w={800} size={15} color={on ? C.ink : C.white}>{LABELS[name]}</T>
      </Pressable>
    );
  };

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 14, height: 68, backgroundColor: C.ink, borderRadius: 26, flexDirection: 'row', alignItems: 'center' }, shadow(5, C.pink)]}>
      {w > 0 && (
        <Animated.View style={{ position: 'absolute', top: 8, bottom: 8, left: 6, width: col - 12, borderRadius: 18, backgroundColor: C.lime,
          transform: [{ translateX: Animated.multiply(x, col) }] }} />
      )}
      {tab('index')}
      {tab('subs')}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Loop kind="floaty" duration={2600}>
          <Pressable accessibilityRole="button" accessibilityLabel="Add subscription" onPress={() => router.push('/sub/form')}
            style={({ pressed }) => [{ width: 64, height: 64, marginTop: -38, borderRadius: 32, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center',
              transform: pressed ? [{ rotate: '90deg' }, { scale: 0.86 }] : [] }, border(3), pressed ? {} : shadow(3)]}>
            <T w={800} size={34} style={{ lineHeight: 38 }}>+</T>
          </Pressable>
        </Loop>
      </View>
      {tab('settings')}
    </View>
  );
}

export default function TabsLayout() {
  const { setToastLift } = useFx();
  // Toasts sit above the nav bar while the tabs are on screen.
  useFocusEffect(useCallback(() => {
    setToastLift(true);
    return () => setToastLift(false);
  }, [setToastLift]));

  return (
    <Tabs tabBar={(p) => <NavBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.cream } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="subs" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

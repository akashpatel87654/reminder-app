import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

// Cream page with safe-area top; `scroll` for the long screens, `bottom` leaves room for the tab bar.
export function Screen({ children, scroll, bottom = 40, bg = C.cream, ...p }: { children: ReactNode; scroll?: boolean; bottom?: number; bg?: string } & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  if (!scroll) return <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView {...p} style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: insets.bottom + bottom }, p.contentContainerStyle]}>
        {children}
      </ScrollView>
      {/* Solid strip under the status bar so scrolled content doesn't run beneath the clock. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: bg }} />
    </View>
  );
}

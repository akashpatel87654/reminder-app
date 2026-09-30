import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

// Cream page with safe-area top; `scroll` for the long screens, `bottom` leaves room for the tab bar.
export function Screen({ children, scroll, bottom = 40, bg = C.cream, ...p }: { children: ReactNode; scroll?: boolean; bottom?: number; bg?: string } & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  if (!scroll) return <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>{children}</View>;
  return (
    <ScrollView {...p} style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: insets.bottom + bottom }, p.contentContainerStyle]}>
      {children}
    </ScrollView>
  );
}

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { daysUntil, fmtDay, formatDate, parseDate, today } from '../lib/subs';
import { C } from '../theme';
import { Sheet } from './overlays';
import { T } from './ui';

const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Pickable range is [min, max] (YYYY-MM-DD); defaults: today → 2 years out (far enough for yearly renewals).
export function Calendar({ visible, value, onPick, onClose, min, max, title }: {
  visible: boolean; value: string; onPick: (d: string) => void; onClose: () => void; min?: string; max?: string; title?: string;
}) {
  const now = parseDate(today());
  const sel = parseDate(value);
  const lo = min ?? today();
  const hi = max ?? formatDate(new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()));
  const monthsFromNow = (s: string) => { const d = parseDate(s); return (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth(); };
  const minOff = monthsFromNow(lo), maxOff = monthsFromNow(hi);
  const [offset, setOffset] = useState(Math.min(maxOff, Math.max(minOff, monthsFromNow(value))));
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = first.getFullYear(), m = first.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const nav = (label: string, d: number, disabled: boolean) => (
    <Pressable accessibilityLabel={d < 0 ? 'Previous month' : 'Next month'} disabled={disabled} onPress={() => setOffset((o) => o + d)} hitSlop={4}
      style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: C.ink, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.3 : 1, transform: [{ scale: pressed ? 0.85 : 1 }] })}>
      <T w={800} size={18}>{label}</T>
    </Pressable>
  );

  return (
    <Sheet visible={visible} onClose={onClose} handle>
      {!!title && <T mono size={12} style={{ letterSpacing: 1, textAlign: 'center', marginBottom: 10 }}>{title}</T>}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {nav('‹', -1, offset <= minOff)}
        <T w={800} size={22} style={{ letterSpacing: -0.5 }}>{MONL[m]} {y}</T>
        {nav('›', 1, offset >= maxOff)}
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <T key={i} mono size={11} style={{ width: `${100 / 7}%`, textAlign: 'center' }}>{d}</T>)}
      </View>
      <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {cells.map((d, i) => {
          if (d == null) return <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />;
          const iso = formatDate(new Date(y, m, d));
          const n = daysUntil(iso), picked = iso === value, past = iso < lo || iso > hi;
          return (
            <View key={iso} style={{ width: `${100 / 7}%`, paddingHorizontal: 3 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={fmtDay(iso)} accessibilityState={{ selected: picked, disabled: past }} disabled={past}
                onPress={() => { onPick(iso); setTimeout(onClose, 280); }}
                style={({ pressed }) => ({ height: 44, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  borderColor: picked || n === 0 ? C.ink : '#14141433', backgroundColor: picked ? C.pink : n === 0 ? C.lime : C.white, opacity: past ? 0.3 : 1,
                  transform: picked ? [{ rotate: '-6deg' }, { scale: 1.12 }] : pressed ? [{ scale: 0.85 }] : [] })}>
                <T w={700} size={15}>{d}</T>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

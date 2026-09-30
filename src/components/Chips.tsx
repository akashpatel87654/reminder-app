import { Pressable, Text, View } from 'react-native';

export function Chips<T extends string>({ options, value, onChange }: {
  options: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
      {(Object.keys(options) as T[]).map((k) => (
        <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="radio" accessibilityState={{ selected: k === value }}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: k === value ? '#2563eb' : '#eee' }}>
          <Text style={{ color: k === value ? '#fff' : '#111' }}>{options[k]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

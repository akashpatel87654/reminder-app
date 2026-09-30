import { Text, View } from 'react-native';
import { money, monthlyTotals, upcoming, type Subscription } from '../lib/subs';
import { styles } from '../lib/styles';

export function Summary({ subs }: { subs: Subscription[] }) {
  const totals = Object.entries(monthlyTotals(subs));
  const soon = upcoming(subs);
  if (!subs.length) return null;
  return (
    <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', marginBottom: 12 }}>
      <Text style={styles.muted}>You spend</Text>
      {totals.length ? totals.map(([cur, m]) => (
        <Text key={cur} style={{ fontSize: 22, fontWeight: '700' }}>
          {money(m, cur)}<Text style={styles.muted}>/mo</Text>  {money(m * 12, cur)}<Text style={styles.muted}>/yr</Text>
        </Text>
      )) : <Text style={{ fontSize: 22, fontWeight: '700' }}>Nothing recurring</Text>}
      <Text style={[styles.muted, { marginTop: 8 }]}>
        {soon.length ? `${soon.length} due in the next 7 days: ${soon.map((s) => s.name).join(', ')}` : 'Nothing due in the next 7 days'}
      </Text>
    </View>
  );
}

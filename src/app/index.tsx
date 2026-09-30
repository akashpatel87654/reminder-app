import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { daysUntil, deleteSub, listSubs, money, setStatus, TYPE_LABELS, type Subscription } from '../lib/subs';
import { listStyles, styles } from '../lib/styles';
import { Summary } from '../components/Summary';

function dueLabel(days: number) {
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

export default function Home() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSubs(await listSubs());
    } catch (e) {
      Alert.alert('Could not load', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ponytail: long-press menu instead of swipe actions; swap to swipeable rows when the design asks for it.
  const actions = (s: Subscription) =>
    Alert.alert(s.name, undefined, [
      s.status === 'active'
        ? { text: 'Mark cancelled', onPress: () => setStatus(s.id, 'cancelled').then(load) }
        : { text: 'Reactivate', onPress: () => setStatus(s.id, 'active').then(load) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(s) },
      { text: 'Close', style: 'cancel' },
    ]);
  const confirmDelete = (s: Subscription) =>
    Alert.alert(`Delete ${s.name}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSub(s.id).then(load) },
    ]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={subs}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={<Summary subs={subs} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text style={styles.muted}>No subscriptions yet. Tap + to add one.</Text> : null}
        renderItem={({ item: s }) => {
          const days = daysUntil(s.next_date);
          const cancelled = s.status === 'cancelled';
          const urgent = !cancelled && days <= 2;
          return (
            <Pressable style={[listStyles.row, cancelled && { opacity: 0.4 }]} onLongPress={() => actions(s)}
              onPress={() => router.push({ pathname: '/sub/[id]', params: { id: s.id } })}>
              <View style={{ flex: 1 }}>
                <Text style={listStyles.name}>{s.name}</Text>
                <Text style={styles.muted}>
                  {money(s.price, s.currency)} · {cancelled ? 'Cancelled' : TYPE_LABELS[s.type]} · {s.next_date}
                </Text>
              </View>
              {!cancelled && (
                <Text style={[listStyles.badge, { backgroundColor: urgent ? '#fee2e2' : '#eef2ff', color: urgent ? '#b91c1c' : '#3730a3' }]}>
                  {dueLabel(days)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
      <Link href={{ pathname: '/sub/[id]', params: { id: 'new' } }} asChild>
        <Pressable style={listStyles.fab} accessibilityLabel="Add subscription">
          <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30 }}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Confirm, useFx } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { Chip, Letter, Loop, Pill, Rise, T } from '../../components/ui';
import { useStore } from '../../lib/store';
import { badge, daysUntil, kind, money, priceLabel, toMonthly, type Subscription } from '../../lib/subs';
import { border, C, F, shadow } from '../../theme';

const FILTERS: Record<string, (s: Subscription) => boolean> = {
  all: () => true,
  trials: (s) => s.type === 'free_trial' && s.status === 'active',
  'auto-renew': (s) => s.type === 'auto_renew' && s.status === 'active',
  expires: (s) => s.type === 'expires' && s.status === 'active',
  cancelled: (s) => s.status !== 'active',
};
const OPEN_X = -168;

export default function Subs() {
  const { subs, profile, patch, remove } = useStore();
  const { toast } = useFx();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Subscription | null>(null);

  const cur = profile?.currency ?? 'INR';
  const q = search.trim().toLowerCase();
  const rows = subs
    .filter(FILTERS[filter])
    .filter((s) => !q || `${s.name} ${s.category ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') || daysUntil(a.next_date) - daysUntil(b.next_date));

  async function toggleCancel(s: Subscription) {
    setOpenRow(null);
    const next = s.status === 'active' ? 'cancelled' : 'active';
    try {
      const { queued } = await patch(s.id, { status: next });
      toast(queued ? 'saved offline ✦ syncs when you’re back' : next === 'cancelled' ? 'cancelled. your wallet says thx 💸' : 'back from the dead ✦ reminders on');
    } catch {
      toast('couldn’t save that. try again');
    }
  }
  async function doDelete(s: Subscription) {
    setConfirm(null);
    setOpenRow(null);
    try {
      const { queued } = await remove(s.id);
      toast(queued ? 'gone ✦ syncs when you’re back' : 'gone. poof. 💨');
    } catch {
      toast('couldn’t delete that. try again');
    }
  }

  return (
    <Screen scroll bottom={130}>
      <Rise style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <T w={800} size={42} style={{ letterSpacing: -1.6, lineHeight: 44 }}>your subs</T>
          <T mono size={13} style={{ marginTop: 6 }}>monthly burn · {money(subs.reduce((a, s) => a + toMonthly(s, cur), 0), cur)}</T>
        </View>
        <Loop kind="floaty" duration={2400}>
          <View style={[{ width: 58, height: 58, borderRadius: 18, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] }, border(3), shadow(4)]}>
            <T w={800} size={26}>{subs.filter((s) => s.status === 'active').length}</T>
          </View>
        </Loop>
      </Rise>

      <Rise delay={40} style={[{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingLeft: 16, paddingRight: 8, borderRadius: 16, backgroundColor: C.white }, border(), shadow(4)]}>
        <T size={16}>🔍</T>
        <TextInput value={search} onChangeText={(v) => { setSearch(v); setOpenRow(null); }} placeholder="search subs or categories" placeholderTextColor="#14141466"
          style={{ flex: 1, height: '100%', fontFamily: F[600], fontSize: 16, color: C.ink }} />
        {!!search && (
          <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <T w={800} size={16} color={C.white}>×</T>
          </Pressable>
        )}
      </Rise>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 10 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
        {Object.keys(FILTERS).map((k, i) => <Chip key={k} label={k} on={filter === k} i={i} onPress={() => { setFilter(k); setOpenRow(null); }} />)}
      </ScrollView>

      <View style={{ marginTop: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Loop kind="nudge" duration={1400}><T mono size={12}>←</T></Loop>
        <T mono size={12}>swipe a row to cancel or delete</T>
      </View>

      {rows.map((s, i) => (
        <Rise key={s.id} delay={80 + i * 50}>
          <SwipeRow sub={s} open={openRow === s.id} onOpen={(o) => setOpenRow(o ? s.id : null)}
            onCancel={() => toggleCancel(s)} onDelete={() => setConfirm(s)} />
        </Rise>
      ))}
      {!rows.length && (
        <View style={{ padding: 28, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.ink, borderRadius: 24 }}>
          <T w={700} size={16} style={{ textAlign: 'center' }}>{q ? `no “${search.trim()}” here. typo?` : 'nothing here. suspicious 🕵️'}</T>
        </View>
      )}

      <Confirm visible={!!confirm} title={`delete ${confirm?.name ?? ''}?`} body="this removes it and all its reminders. no undo." yes="delete"
        onYes={() => confirm && doDelete(confirm)} onClose={() => setConfirm(null)} />
    </Screen>
  );
}

function SwipeRow({ sub: s, open, onOpen, onCancel, onDelete }: { sub: Subscription; open: boolean; onOpen: (o: boolean) => void; onCancel: () => void; onDelete: () => void }) {
  const x = useRef(new Animated.Value(0)).current;
  const base = useRef(0);
  const dragged = useRef(false); // a drag must not also count as a tap
  useEffect(() => {
    base.current = open ? OPEN_X : 0;
    Animated.spring(x, { toValue: base.current, friction: 7, useNativeDriver: true }).start();
  }, [open, x]);

  const pan = useRef(PanResponder.create({
    // Only claim clearly horizontal drags so the page still scrolls.
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { dragged.current = true; },
    onPanResponderMove: (_, g) => x.setValue(Math.min(0, Math.max(-200, base.current + g.dx))),
    onPanResponderRelease: (_, g) => {
      const openNow = base.current + g.dx < -70;
      base.current = openNow ? OPEN_X : 0;
      Animated.spring(x, { toValue: base.current, friction: 7, useNativeDriver: true }).start();
      onOpen(openNow);
      setTimeout(() => { dragged.current = false; }, 50);
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: base.current, useNativeDriver: true }).start(),
  })).current;

  const b = badge(s);
  const active = s.status === 'active';
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ position: 'absolute', top: 0, bottom: 4, right: 0, flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onCancel} style={({ pressed }) => [{ width: 76, borderRadius: 18, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }, border()]}>
          <T w={800} size={13}>{active ? 'cancel' : 'revive'}</T>
        </Pressable>
        <Pressable onPress={onDelete} style={({ pressed }) => [{ width: 76, borderRadius: 18, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }, border()]}>
          <T w={800} size={13} color={C.white}>delete</T>
        </Pressable>
      </View>
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}>
        <Pressable accessibilityHint="Swipe left for cancel and delete"
          onPress={() => {
            if (dragged.current) return;
            if (open) onOpen(false);
            else router.push({ pathname: '/sub/[id]', params: { id: s.id } });
          }}
          style={[{ backgroundColor: C.white, borderRadius: 20 }, border(), shadow(4)]}>
          {/* Dim the content, not the card, so the action buttons behind stay hidden. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, opacity: active ? 1 : 0.6 }}>
          <Letter name={s.name} color={s.color} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w={800} size={17} numberOfLines={1} style={{ letterSpacing: -0.3, textDecorationLine: active ? 'none' : 'line-through' }}>{s.name}</T>
            <T mono size={12}>{kind(s)} · {priceLabel(s)}</T>
          </View>
          <Pill text={b.text} bg={b.bg} fg={b.fg} pulse={b.hot} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

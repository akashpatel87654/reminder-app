import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from '../../components/Calendar';
import { useFx } from '../../components/overlays';
import { Btn, Chip, Field, Label, Letter, RoundBtn, Rise, T, Toggle } from '../../components/ui';
import { useStore } from '../../lib/store';
import {
  addDays, CATEGORIES, nextFromStart, CURRENCIES, CYC, CYCLES, daysUntil, DOW, fmtDay, hourLabel, money, POPULAR, reminderAt,
  REMIND_OPTIONS, SYM, today, toggleDay, TYPES, when, type SubInput,
} from '../../lib/subs';
import { border, C, F, PALETTE, shadow } from '../../theme';

export default function SubForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { subs, profile, save } = useStore();
  const { toast, confetti } = useFx();
  const insets = useSafeAreaInsets();
  const existing = id ? subs.find((s) => s.id === id) : undefined;

  const [f, setForm] = useState<SubInput>(() => {
    if (existing) {
      const { id: _, ...rest } = existing;
      return rest;
    }
    return {
      name: '', portal_url: null, category: 'Other', price: 0, currency: profile?.currency ?? 'INR', type: 'auto_renew',
      billing_cycle: 'monthly', custom_days: 30, start_date: today(), next_date: nextFromStart(today(), 'monthly', 30)!, remind_days_before: profile?.default_remind_days ?? [2],
      email_enabled: profile?.email_enabled ?? true, status: 'active', notes: null, color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    };
  });
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [cal, setCal] = useState<null | 'next' | 'start' | 'remind'>(null);
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<SubInput>) => setForm((x) => ({ ...x, ...p }));
  // Changing the purchase date or the cycle re-derives the next renewal (one-off plans keep theirs).
  const setPlan = (p: Partial<SubInput>) => setForm((x) => {
    const y = { ...x, ...p };
    const next = y.start_date ? nextFromStart(y.start_date, y.billing_cycle, y.custom_days) : null;
    return next ? { ...y, next_date: next } : y;
  });
  // iOS drops a sheet presented while the keyboard is still closing (and the state would then be
  // stuck "open"), so close the keyboard first and open once it's gone.
  const openCal = (k: 'next' | 'start' | 'remind') => {
    if (!Keyboard.isVisible()) return setCal(k);
    const sub = Keyboard.addListener('keyboardDidHide', () => { sub.remove(); setCal(k); });
    Keyboard.dismiss();
  };
  // A picked reminder date is stored as "N days before", so it repeats every cycle.
  const customDays = f.remind_days_before.filter((d) => !REMIND_OPTIONS.includes(d));

  const days = daysUntil(f.next_date);
  const typeIdx = TYPES.findIndex((t) => t[0] === f.type);
  const priceShown = (price ? money(parseFloat(price) || 0, f.currency) : `${SYM[f.currency] ?? ''}0.00`) + CYC[f.billing_cycle];

  async function onSave() {
    const name = f.name.trim();
    const p = parseFloat(price);
    if (!name) return toast('give it a name first bestie');
    if (!(p >= 0)) return toast('how much tho? add a price');
    const portal = f.portal_url?.trim();
    setSaving(true);
    try {
      const { sub: saved, queued } = await save({
        ...f, name, price: p, notes: f.notes?.trim() || null,
        portal_url: portal ? (/^https?:\/\//i.test(portal) ? portal : `https://${portal}`) : null,
        custom_days: f.billing_cycle === 'custom_days' ? Math.max(1, f.custom_days || 30) : null,
      }, existing?.id);
      confetti();
      const hour = profile?.reminder_hour ?? 9;
      const next = [...f.remind_days_before].sort((a, b) => b - a).map((d) => reminderAt(f.next_date, d, hour)).find((at) => at.getTime() > Date.now());
      toast(queued ? 'saved offline ✦ syncs when you’re back' : !next ? 'saved ✦ reminder firing now' : `saved ✦ we’ll ping you ${DOW[next.getDay()]} at ${hourLabel(hour)}`);
      router.replace({ pathname: '/sub/[id]', params: { id: saved.id } });
    } catch {
      toast('couldn’t save that. try again');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 24 }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RoundBtn />
          <T accessibilityRole="header" w={800} size={22} style={{ letterSpacing: -0.5 }}>{existing ? 'edit sub' : 'new sub'}</T>
          <View style={{ width: 48 }} />
        </Rise>

        <Rise delay={50} style={[{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: f.color, borderRadius: 26, padding: 16, transform: [{ rotate: '-1.5deg' }] }, border(3), shadow(6)]}>
          <Letter name={f.name} color={C.white} size={58} fontSize={26} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w={800} size={22} numberOfLines={1} style={{ letterSpacing: -0.5 }}>{f.name.trim() || 'name it…'}</T>
            <T mono size={13}>{priceShown}</T>
          </View>
          <View style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.white }, border(2)]}><T w={800} size={12}>{when(days)}</T></View>
        </Rise>
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          {PALETTE.map((c) => (
            <Pressable key={c} accessibilityLabel={`Color ${c}`} accessibilityState={{ selected: c === f.color }} onPress={() => set({ color: c })} hitSlop={7}
              style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: c }, border(),
                c === f.color && [{ transform: [{ scale: 1.25 }, { rotate: '-8deg' }] }, shadow(2)]]} />
          ))}
        </View>

        {!existing && (
          <>
            <Label style={{ marginTop: 22 }}>QUICK PICK</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}>
              {POPULAR.map((p) => (
                <Pressable key={p.name} onPress={() => set({ name: p.name, color: p.color, category: p.category })}
                  style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingLeft: 8, paddingRight: 14, borderRadius: 999, backgroundColor: C.white,
                    transform: [{ scale: pressed ? 0.9 : 1 }] }, border(), shadow(2)]}>
                  <View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: p.color }, border(2)]} />
                  <T w={700} size={14}>{p.name}</T>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Label>NAME</Label>
        <Field value={f.name} onChangeText={(v) => set({ name: v })} placeholder="netflix, gym, that one app…" maxLength={80} />

        <Label>PRICE</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))} placeholder="0.00" keyboardType="decimal-pad"
            style={{ flex: 1, minWidth: 0, fontFamily: F.mono500, fontSize: 20 }} />
          <Pressable accessibilityLabel="Change currency" onPress={() => set({ currency: CURRENCIES[(CURRENCIES.indexOf(f.currency) + 1) % CURRENCIES.length] })}
            style={({ pressed }) => [{ height: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.yellow, justifyContent: 'center' }, border(),
              pressed ? { transform: [{ translateX: 3 }, { translateY: 3 }] } : shadow(4)]}>
            <T w={800} size={16}>{SYM[f.currency] ?? ''} {f.currency} ↻</T>
          </Pressable>
        </View>

        <Label>TYPE</Label>
        <View style={[{ flexDirection: 'row', height: 52, borderRadius: 16, backgroundColor: C.white, padding: 4 }, border(), shadow(4)]}>
          {TYPES.map(([k, label], i) => (
            <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: i === typeIdx }} onPress={() => set({ type: k })}
              style={{ flex: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: i === typeIdx ? C.ink : 'transparent' }}>
              <T w={800} size={14} color={i === typeIdx ? C.lime : C.ink}>{label}</T>
            </Pressable>
          ))}
        </View>

        <Label>BILLING CYCLE</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CYCLES.map(([k, label], i) => <Chip key={k} i={i} label={label} on={f.billing_cycle === k} onPress={() => setPlan({ billing_cycle: k })} />)}
        </View>
        {f.billing_cycle === 'custom_days' && (
          <Rise style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T w={700}>every</T>
            <TextInput value={f.custom_days ? String(f.custom_days) : ''} onChangeText={(v) => setPlan({ custom_days: parseInt(v.replace(/\D/g, ''), 10) || null })}
              keyboardType="number-pad" maxLength={3} accessibilityLabel="Days per cycle"
              style={[{ width: 80, height: 44, borderRadius: 12, textAlign: 'center', fontFamily: F.mono, fontSize: 18, backgroundColor: C.white, color: C.ink }, border()]} />
            <T w={700}>days</T>
          </Rise>
        )}

        <Label>{f.type === 'free_trial' ? 'TRIAL STARTED ON' : 'PURCHASED ON'}</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={`Purchased on ${f.start_date ? fmtDay(f.start_date) : 'not set'}`} onPress={() => openCal('start')}
          style={({ pressed }) => [{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.white }, border(),
          pressed ? { transform: [{ translateX: 3 }, { translateY: 3 }] } : shadow(4)]}>
          <T w={700} size={17}>🛒 {f.start_date ? fmtDay(f.start_date) : 'add date'}</T>
          {f.billing_cycle !== 'one_time' && !!f.start_date && <T mono size={12}>sets next date ↓</T>}
        </Pressable>

        <Label>{f.type === 'free_trial' ? 'TRIAL ENDS' : f.type === 'expires' ? 'EXPIRES ON' : 'NEXT RENEWAL'}</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={`Next date ${fmtDay(f.next_date)}`} onPress={() => openCal('next')} style={({ pressed }) => [{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.white }, border(),
          pressed ? { transform: [{ translateX: 3 }, { translateY: 3 }] } : shadow(4)]}>
          <T w={700} size={17}>📅 {fmtDay(f.next_date)}</T>
          <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.lime }, border(2)]}><T w={800} size={12}>{when(days)}</T></View>
        </Pressable>

        <Label>NAG ME</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REMIND_OPTIONS.map((r, i) => (
            <Chip key={r} i={i} label={r === 0 ? 'day of' : `${r}d before`} on={f.remind_days_before.includes(r)}
              onPress={() => set({ remind_days_before: toggleDay(f.remind_days_before, r) })} />
          ))}
          {customDays.map((d) => (
            <Chip key={`c${d}`} label={`${fmtDay(addDays(f.next_date, -d))} ✕`} on onPress={() => set({ remind_days_before: toggleDay(f.remind_days_before, d) })} />
          ))}
          <Chip label="📅 pick a date" on={false} onPress={() => openCal('remind')} />
        </View>

        <View style={[{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.white }, border(), shadow(4)]}>
          <View style={{ flex: 1 }}><T w={800} size={16}>email me too</T><T mono size={12}>backup in case you mute us</T></View>
          <Toggle label="Email me too" on={f.email_enabled} onPress={() => set({ email_enabled: !f.email_enabled })} />
        </View>

        <Label>CATEGORY</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c, i) => <Chip key={c} i={i} h={38} size={13} label={c.toLowerCase()} on={f.category === c} onPress={() => set({ category: c })} />)}
        </View>

        <Label>MANAGE LINK (OPTIONAL)</Label>
        <Field value={f.portal_url ?? ''} onChangeText={(v) => set({ portal_url: v })} placeholder="netflix.com/account" autoCapitalize="none" keyboardType="url" autoCorrect={false} style={{ fontSize: 16 }} />

        <Label>NOTES</Label>
        <TextInput value={f.notes ?? ''} onChangeText={(v) => set({ notes: v })} placeholder="shared w/ roommate, cancel after finals…" placeholderTextColor={C.placeholder} multiline
          style={[{ minHeight: 90, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontFamily: F[500], fontSize: 16, color: C.ink, backgroundColor: C.note, textAlignVertical: 'top' }, border(), shadow(4)]} />
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, backgroundColor: C.cream }}>
        <Btn title={saving ? 'saving…' : existing ? 'save changes ✓' : 'add it ✦'} h={60} size={19} shadowColor={C.pink} disabled={saving} onPress={onSave} />
      </View>

      {/* Solid strip under the status bar so scrolled content doesn't run beneath the clock. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: C.cream }} />

      {cal === 'next' && <Calendar visible value={f.next_date} onPick={(d) => set({ next_date: d })} onClose={() => setCal(null)} />}
      {cal === 'start' && (
        <Calendar visible title="PURCHASED ON" value={f.start_date ?? today()} min={addDays(today(), -365 * 5)} max={today()}
          onPick={(d) => setPlan({ start_date: d })} onClose={() => setCal(null)} />
      )}
      {cal === 'remind' && (
        <Calendar visible title="REMIND ME ON" value={addDays(f.next_date, -Math.min(2, Math.max(0, days)))} min={today()} max={f.next_date}
          onPick={(d) => set({ remind_days_before: toggleDay(f.remind_days_before.filter((x) => x !== daysUntil(f.next_date) - daysUntil(d)), daysUntil(f.next_date) - daysUntil(d)) })}
          onClose={() => setCal(null)} />
      )}
    </KeyboardAvoidingView>
  );
}

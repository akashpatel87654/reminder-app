import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Chips } from '../../components/Chips';
import { getProfile } from '../../lib/profile';
import { CYCLE_LABELS, formatDate, getSub, parseDate, saveSub, today, TYPE_LABELS, type SubInput } from '../../lib/subs';
import { listStyles, styles } from '../../lib/styles';

const BLANK: SubInput = {
  name: '', portal_url: null, category: null, price: 0, currency: 'INR', type: 'auto_renew',
  billing_cycle: 'monthly', custom_days: null, next_date: today(), remind_days_before: [2],
  email_enabled: true, status: 'active', notes: null,
};

// "7, 2, 0" → [7, 2, 0]; invalid entries dropped.
const parseDays = (s: string) =>
  [...new Set(s.split(',').map((x) => parseInt(x, 10)).filter((n) => n >= 0 && n <= 365))].sort((a, b) => b - a);

export default function SubForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const [form, setForm] = useState<SubInput>(BLANK);
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('2');
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SubInput>(k: K, v: SubInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isNew) {
      getProfile().then((p) => {
        setForm((f) => ({ ...f, currency: p.currency, remind_days_before: p.default_remind_days, email_enabled: p.email_enabled }));
        setDays(p.default_remind_days.join(', '));
      }, () => {});
      return;
    }
    getSub(id).then((s) => {
      const { id: _, ...rest } = s;
      setForm(rest);
      setPrice(String(s.price));
      setDays(s.remind_days_before.join(', '));
    }, (e) => Alert.alert('Could not load', e.message));
  }, [id, isNew]);

  const pickDate = () =>
    DateTimePickerAndroid.open({
      value: parseDate(form.next_date), mode: 'date',
      onValueChange: (_, d) => set('next_date', formatDate(d)),
    });

  async function save() {
    const input: SubInput = {
      ...form,
      name: form.name.trim(),
      price: Number(price) || 0,
      currency: form.currency.trim().toUpperCase(),
      remind_days_before: parseDays(days),
      custom_days: form.billing_cycle === 'custom_days' ? form.custom_days : null,
      portal_url: form.portal_url?.trim() || null,
      category: form.category?.trim() || null,
      notes: form.notes?.trim() || null,
    };
    if (!input.name) return Alert.alert('Name is required');
    if (!/^[A-Z]{3}$/.test(input.currency)) return Alert.alert('Currency must be a 3-letter code, e.g. INR');
    if (input.billing_cycle === 'custom_days' && !(input.custom_days && input.custom_days > 0))
      return Alert.alert('Enter how many days the cycle lasts');
    setSaving(true);
    try {
      await saveSub(input, isNew ? undefined : id);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? 'Add subscription' : 'Edit subscription' }} />

      <Text style={listStyles.label}>Name</Text>
      <TextInput style={styles.input} placeholder="Netflix" value={form.name} onChangeText={(v) => set('name', v)} />

      <Text style={listStyles.label}>Price</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="649" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        <TextInput style={[styles.input, { width: 80 }]} autoCapitalize="characters" maxLength={3}
          value={form.currency} onChangeText={(v) => set('currency', v)} />
      </View>

      <Text style={listStyles.label}>Type</Text>
      <Chips options={TYPE_LABELS} value={form.type} onChange={(v) => set('type', v)} />

      <Text style={listStyles.label}>Billing cycle</Text>
      <Chips options={CYCLE_LABELS} value={form.billing_cycle} onChange={(v) => set('billing_cycle', v)} />
      {form.billing_cycle === 'custom_days' && (
        <TextInput style={styles.input} placeholder="Days, e.g. 28" keyboardType="number-pad"
          value={form.custom_days ? String(form.custom_days) : ''} onChangeText={(v) => set('custom_days', parseInt(v, 10) || null)} />
      )}

      <Text style={listStyles.label}>{form.type === 'auto_renew' ? 'Next renewal date' : form.type === 'free_trial' ? 'Trial ends on' : 'Expires on'}</Text>
      {Platform.OS === 'android' ? (
        <Pressable onPress={pickDate} style={styles.input}><Text>{form.next_date}</Text></Pressable>
      ) : (
        <DateTimePicker style={{ alignSelf: 'flex-start', marginVertical: 8 }} value={parseDate(form.next_date)} mode="date"
          display="compact" onValueChange={(_, d) => set('next_date', formatDate(d))} />
      )}

      <Text style={listStyles.label}>Remind me (days before, comma separated)</Text>
      <TextInput style={styles.input} placeholder="7, 2, 0" keyboardType="numbers-and-punctuation" value={days} onChangeText={setDays} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={listStyles.label}>Email reminders</Text>
        <Switch value={form.email_enabled} onValueChange={(v) => set('email_enabled', v)} />
      </View>

      <Text style={listStyles.label}>Portal URL (optional)</Text>
      <TextInput style={styles.input} placeholder="https://netflix.com/account" autoCapitalize="none" keyboardType="url"
        value={form.portal_url ?? ''} onChangeText={(v) => set('portal_url', v)} />

      <Text style={listStyles.label}>Category (optional)</Text>
      <TextInput style={styles.input} placeholder="Streaming" value={form.category ?? ''} onChangeText={(v) => set('category', v)} />

      <Text style={listStyles.label}>Notes (optional)</Text>
      <TextInput style={[styles.input, { minHeight: 80 }]} multiline value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} />

      <Button title={saving ? 'Saving…' : 'Save'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}

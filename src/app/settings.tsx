import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Share, Switch, Text, TextInput, View } from 'react-native';
import { signOut } from '../lib/auth';
import { getProfile, updateProfile, type Profile } from '../lib/profile';
import { listStyles, styles } from '../lib/styles';
import { listSubs, toCsv } from '../lib/subs';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hour, setHour] = useState('');
  const [days, setDays] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setHour(String(p.reminder_hour));
      setDays(p.default_remind_days.join(', '));
      setCurrency(p.currency);
    }, (e) => Alert.alert('Could not load', e.message));
  }, []);

  async function save() {
    const h = parseInt(hour, 10);
    const d = [...new Set(days.split(',').map((x) => parseInt(x, 10)).filter((n) => n >= 0 && n <= 365))].sort((a, b) => b - a);
    const cur = currency.trim().toUpperCase();
    if (!(h >= 0 && h <= 23)) return Alert.alert('Reminder hour must be 0–23');
    if (!/^[A-Z]{3}$/.test(cur)) return Alert.alert('Currency must be a 3-letter code, e.g. INR');
    setSaving(true);
    try {
      await updateProfile({ reminder_hour: h, default_remind_days: d.length ? d : [2], currency: cur });
      Alert.alert('Saved');
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const toggleEmail = async (v: boolean) => {
    setProfile((p) => p && { ...p, email_enabled: v });
    updateProfile({ email_enabled: v }).catch((e) => Alert.alert('Could not save', e.message));
  };

  const exportCsv = async () => {
    try {
      await Share.share({ title: 'subscriptions.csv', message: toCsv(await listSubs()) });
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    }
  };

  const deleteAccount = () =>
    Alert.alert('Delete account?', 'All your subscriptions and settings will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.rpc('delete_account');
          if (error) return Alert.alert('Could not delete', error.message);
          await signOut();
        },
      },
    ]);

  if (!profile) return null;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <Text style={styles.muted}>Signed in as {profile.email} · {profile.timezone}</Text>

      <Text style={listStyles.label}>Reminder time (hour, 0–23)</Text>
      <TextInput style={styles.input} keyboardType="number-pad" maxLength={2} value={hour} onChangeText={setHour} />

      <Text style={listStyles.label}>Default reminder days (for new subscriptions)</Text>
      <TextInput style={styles.input} keyboardType="numbers-and-punctuation" value={days} onChangeText={setDays} />

      <Text style={listStyles.label}>Default currency</Text>
      <TextInput style={styles.input} autoCapitalize="characters" maxLength={3} value={currency} onChangeText={setCurrency} />

      <Button title={saving ? 'Saving…' : 'Save'} onPress={save} disabled={saving} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <Text style={listStyles.label}>Email reminders (all subscriptions)</Text>
        <Switch value={profile.email_enabled} onValueChange={toggleEmail} />
      </View>

      <View style={{ height: 24 }} />
      <Button title="Export as CSV" onPress={exportCsv} />
      <Button title="Log out" onPress={signOut} />
      <Button title="Delete account" color="#b91c1c" onPress={deleteAccount} />
    </ScrollView>
  );
}

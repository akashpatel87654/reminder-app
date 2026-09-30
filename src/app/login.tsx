import { useState } from 'react';
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { styles } from '../lib/styles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ error: Error | null }>) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    return !error;
  }

  const sendCode = async () => {
    if (await run(() => supabase.auth.signInWithOtp({ email: email.trim() }))) setSent(true);
  };
  // On success onAuthStateChange flips the session and the guard routes home.
  const verify = () => run(() => supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { justifyContent: 'center' }]}>
      <Text style={styles.title}>SubTrack</Text>
      <Text style={styles.muted}>Never miss a renewal.</Text>
      <View style={{ height: 24 }} />
      {!sent ? (
        <>
          <TextInput style={styles.input} placeholder="you@example.com" autoCapitalize="none" autoComplete="email"
            keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Button title="Send code" onPress={sendCode} disabled={busy || !email.includes('@')} />
        </>
      ) : (
        <>
          <Text style={styles.muted}>Enter the code sent to {email}</Text>
          <TextInput style={styles.input} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code"
            value={code} onChangeText={setCode} maxLength={10} />
          <Button title="Verify" onPress={verify} disabled={busy || code.trim().length < 6} />
          <Button title="Use a different email" onPress={() => { setSent(false); setCode(''); }} />
        </>
      )}
      {busy && <ActivityIndicator style={{ marginTop: 16 }} />}
    </KeyboardAvoidingView>
  );
}

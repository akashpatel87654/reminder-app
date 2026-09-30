import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { ErrorView, useFx } from '../components/overlays';
import { Screen } from '../components/Screen';
import { Btn, Field, Loop, PopIn, RoundBtn, Rise, T } from '../components/ui';
import { isNetworkError, pref } from '../lib/store';
import { supabase } from '../lib/supabase';
import { border, C, F, shadow } from '../theme';

const RESEND_SECS = 60;

export default function Login() {
  const { toast } = useFx();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'error'>('email');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const retry = useRef<() => void>(() => {});

  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (pref.get('onboarded') !== '1') return <Redirect href="/onboard" />;

  const addr = email.trim().toLowerCase();

  async function sendCode() {
    if (!/.+@.+\..+/.test(addr)) return toast('that email looks sus 🤨');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: addr });
    setBusy(false);
    if (error) {
      if (isNetworkError(error)) {
        retry.current = sendCode;
        return setStep('error');
      }
      return toast(error.message.toLowerCase());
    }
    setOtp('');
    setWait(RESEND_SECS);
    setStep('otp');
  }

  async function verify(code: string) {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: addr, token: code, type: 'email' });
    setBusy(false);
    // On success the auth listener swaps the stack to the app.
    if (error) {
      if (isNetworkError(error)) {
        retry.current = () => verify(code);
        return setStep('error');
      }
      setOtp('');
      toast('wrong or expired code. try again');
    }
  }

  const onOtp = (v: string) => {
    const code = v.replace(/\D/g, '').slice(0, 6);
    setOtp(code);
    if (code.length === 6) verify(code);
  };

  if (step === 'error') {
    return <Screen><ErrorView onRetry={() => { setStep('email'); retry.current(); }} onBack={() => setStep('email')} /></Screen>;
  }

  if (step === 'otp') {
    return (
      <Screen>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
          <RoundBtn onPress={() => setStep('email')} />
          <PopIn style={{ marginTop: 36, alignSelf: 'flex-start' }}>
            <View style={[{ width: 84, height: 84, borderRadius: 24, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, border(3), shadow(5)]}>
              <T size={42}>📬</T>
            </View>
          </PopIn>
          <Rise delay={100}><T w={800} size={40} style={{ marginTop: 24, letterSpacing: -1.5, lineHeight: 42 }}>check your inbox</T></Rise>
          <Rise delay={160}><T size={16} style={{ marginTop: 12 }}>we sent a 6-digit code to <T w={800} size={16}>{addr}</T></T></Rise>
          <Rise delay={220} style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const ch = otp[i] ?? '', active = i === otp.length;
                return (
                  <View key={i} style={[{ flex: 1, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ch ? C.lime : C.white,
                    transform: ch ? [{ rotate: `${i % 2 ? 3 : -3}deg` }, { scale: 1.04 }] : active ? [{ translateY: -3 }] : [] }, border(),
                    ch ? shadow(3) : active ? shadow(3, C.pink) : {}]}>
                    <T mono={500} size={26}>{ch}</T>
                  </View>
                );
              })}
            </View>
            {/* One invisible input over the boxes keeps paste + one-time-code autofill working. */}
            <TextInput value={otp} onChangeText={onOtp} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" autoFocus maxLength={6}
              accessibilityLabel="6-digit code" editable={!busy} caretHidden
              style={{ position: 'absolute', inset: 0, opacity: 0.02, color: 'transparent', fontFamily: F.mono, fontSize: 16 }} />
          </Rise>
          <View style={{ flex: 1 }} />
          {wait > 0
            ? <T mono size={12} style={{ textAlign: 'center' }}>didn’t get it? resend in {Math.floor(wait / 60)}:{String(wait % 60).padStart(2, '0')}</T>
            : <Pressable onPress={sendCode} disabled={busy}><T mono size={12} style={{ textAlign: 'center', textDecorationLine: 'underline' }}>didn’t get it? resend code</T></Pressable>}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36 }}>
        <View style={{ height: 280 }}>
          <Loop kind="bob" duration={3200} style={{ position: 'absolute', left: 0, top: 24 }}>
            <View style={[{ width: 118, height: 118, borderRadius: 59, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] }, border(3), shadow(5)]}><T w={800} size={56}>N</T></View>
          </Loop>
          <Loop kind="bob" duration={2600} delay={400} style={{ position: 'absolute', right: 8, top: 6 }}>
            <View style={[{ width: 96, height: 96, borderRadius: 26, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '12deg' }] }, border(3), shadow(5)]}><T w={800} size={48}>$</T></View>
          </Loop>
          <Loop kind="bob" duration={3000} delay={800} style={{ position: 'absolute', left: 118, top: 138 }}>
            <View style={[{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.red, transform: [{ rotate: '-5deg' }] }, border(3), shadow(4)]}><T w={800} size={18} color={C.white}>in 2 days 👀</T></View>
          </Loop>
          <Loop kind="bob" duration={2800} delay={1100} style={{ position: 'absolute', right: 20, top: 204 }}>
            <View style={[{ width: 70, height: 70, borderRadius: 35, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] }, border(3), shadow(4)]}><T w={800} size={34}>S</T></View>
          </Loop>
          <Loop kind="spin" duration={9000} style={{ position: 'absolute', left: 16, top: 196 }}>
            <View style={[{ width: 54, height: 54, borderRadius: 27, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }, border(3)]}><T size={28}>✦</T></View>
          </Loop>
        </View>
        <Rise delay={100} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.lime }, border(2)]} />
          <T mono={500} size={13}>SubTrack</T>
        </Rise>
        <Rise delay={180} style={{ marginTop: 10 }}>
          <T w={800} size={46} style={{ lineHeight: 46, letterSpacing: -1.8 }}>never get</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <View style={[{ backgroundColor: C.pink, borderRadius: 14, paddingHorizontal: 10, transform: [{ rotate: '-2.5deg' }] }, border(3)]}>
              <T w={800} size={46} style={{ lineHeight: 50, letterSpacing: -1.8 }}>surprise</T>
            </View>
            <T w={800} size={46} style={{ lineHeight: 50, letterSpacing: -1.8 }}>charged</T>
          </View>
          <T w={800} size={46} style={{ lineHeight: 46, letterSpacing: -1.8 }}>again.</T>
        </Rise>
        <Rise delay={260}><T size={16} style={{ marginTop: 14, lineHeight: 22 }}>track every sub, trial & renewal. we ping you before your money dips.</T></Rise>
        <View style={{ flex: 1, minHeight: 16 }} />
        <Rise delay={340} style={{ gap: 12 }}>
          <Field value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false}
            onSubmitEditing={sendCode} returnKeyType="send" style={{ height: 58, borderRadius: 18, fontSize: 17 }} />
          <Btn title={busy ? 'sending…' : 'send magic code →'} size={18} disabled={busy} onPress={sendCode} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <T mono size={12}>no passwords. ever. ✌︎</T>
            <T mono size={12}>·</T>
            <Pressable onPress={() => router.push('/privacy')}><T mono size={12} style={{ textDecorationLine: 'underline' }}>privacy</T></Pressable>
          </View>
        </Rise>
      </KeyboardAvoidingView>
    </Screen>
  );
}

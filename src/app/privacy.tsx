import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { RoundBtn, Rise, T } from '../components/ui';
import { border, C, shadow } from '../theme';

const SECTIONS = [
  { n: '01', color: C.lime, title: 'what we store', body: 'your email, the subscriptions you add, and your timezone and reminder time.' },
  { n: '02', color: C.pink, title: 'what we don’t', body: 'no bank logins, no card numbers, no reading your inbox or texts. we never sell your data.' },
  { n: '03', color: C.purple, title: 'who helps us', body: 'Supabase stores your account and subscriptions. Resend sends reminder emails. push reminders are scheduled on your phone itself.' },
  { n: '04', color: C.yellow, title: 'your controls', body: 'export everything as CSV or delete your account anytime in settings. deleting removes all your data.' },
];

// Keep in sync with PRIVACY.md.
export default function Privacy() {
  return (
    <Screen scroll>
      <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RoundBtn />
        <T w={800} size={22} style={{ letterSpacing: -0.5 }}>privacy</T>
        <View style={{ width: 48 }} />
      </Rise>
      <Rise delay={40}><T w={800} size={38} style={{ marginTop: 24, letterSpacing: -1.4, lineHeight: 40 }}>privacy, in plain words</T></Rise>
      <Rise delay={60}><T mono size={12} style={{ marginTop: 8 }}>last updated Sep 30, 2026</T></Rise>
      {SECTIONS.map((s, i) => (
        <Rise key={s.n} delay={100 + i * 40} style={[{ marginTop: i ? 14 : 18, padding: 16, borderRadius: 20, backgroundColor: C.white }, border(), shadow(4)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }, border(2)]}><T mono size={13}>{s.n}</T></View>
            <T w={800} size={18}>{s.title}</T>
          </View>
          <T size={15} style={{ marginTop: 10, lineHeight: 22 }}>{s.body}</T>
        </Rise>
      ))}
      <Rise delay={260} style={{ marginTop: 18, padding: 16, borderRadius: 20, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.ink }}>
        <T w={700} size={15}>questions? heatmonks.venture@gmail.com</T>
      </Rise>
    </Screen>
  );
}

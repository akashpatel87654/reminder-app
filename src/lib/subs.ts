import { C } from '../theme';
import { supabase } from './supabase';

export type SubType = 'auto_renew' | 'expires' | 'free_trial';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom_days' | 'one_time';

export type Subscription = {
  id: string;
  name: string;
  portal_url: string | null;
  category: string | null;
  price: number;
  currency: string;
  type: SubType;
  billing_cycle: BillingCycle;
  custom_days: number | null;
  next_date: string; // YYYY-MM-DD
  remind_days_before: number[];
  email_enabled: boolean;
  status: 'active' | 'cancelled';
  notes: string | null;
  color: string;
};
export type SubInput = Omit<Subscription, 'id'>;

export const TYPES: [SubType, string][] = [['auto_renew', 'auto-renew'], ['expires', 'expires'], ['free_trial', 'free trial']];
export const CYCLES: [BillingCycle, string][] = [['monthly', 'monthly'], ['quarterly', 'quarterly'], ['yearly', 'yearly'], ['custom_days', 'custom'], ['one_time', 'one-time']];
export const CYC: Record<BillingCycle, string> = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr', custom_days: '/custom', one_time: ' once' };
export const REMIND_OPTIONS = [0, 1, 2, 3, 7];
export const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Tools', 'Storage', 'Fitness', 'Learning', 'Domain', 'Other'];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'];
export const SYM: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
// ponytail: fixed USD rates for the "≈ total" across mixed currencies; swap for a daily FX fetch if totals need to be exact.
const RATE: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012 };
export const convert = (v: number, from: string, to: string) => (v * (RATE[from] ?? 1)) / (RATE[to] ?? 1);

export const POPULAR = [
  { name: 'YouTube Premium', color: '#FF4D4D', category: 'Streaming' }, // card colour, ink text
  { name: 'Disney+', color: C.blue, category: 'Streaming' },
  { name: 'Apple Music', color: C.pink, category: 'Music' },
  { name: 'Max', color: C.purple, category: 'Streaming' },
  { name: 'Prime Video', color: C.mint, category: 'Streaming' },
  { name: 'Canva Pro', color: C.yellow, category: 'Tools' },
];

// Dates are calendar days; parse/format in local time so they never shift across zones.
export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => formatDate(new Date());
export const addDays = (s: string, n: number) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return formatDate(d);
};
export const daysUntil = (s: string) => Math.round((parseDate(s).getTime() - parseDate(today()).getTime()) / 86_400_000);

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmtDay = (s: string) => {
  const d = parseDate(s);
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
};
// When the "d days before" reminder fires, in local time.
export const reminderAt = (next: string, d: number, hour: number) => {
  const at = parseDate(addDays(next, -d));
  at.setHours(hour, 0, 0, 0);
  return at;
};
export const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

export const money = (v: number, cur: string) => {
  const n = cur === 'INR'
    ? Math.round(v).toLocaleString('en-IN')
    : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (SYM[cur] ?? `${cur} `) + n;
};
export const priceLabel = (s: Pick<Subscription, 'price' | 'currency' | 'billing_cycle'>) => money(s.price, s.currency) + CYC[s.billing_cycle];

// Recurring cost per month in `cur`. Cancelled, trials still free, and one-offs count as 0
// unless `asIfActive` (the detail screen shows what it would cost).
export function toMonthly(s: Subscription, cur: string, asIfActive = false) {
  if (!asIfActive && (s.status !== 'active' || s.type === 'free_trial')) return 0;
  const p = convert(s.price, s.currency, cur);
  switch (s.billing_cycle) {
    case 'monthly': return p;
    case 'quarterly': return p / 3;
    case 'yearly': return p / 12;
    case 'custom_days': return (p * 30.44) / (s.custom_days || 30);
    case 'one_time': return 0;
  }
}

// Toggle a reminder offset, keeping at least one selected.
export const toggleDay = (arr: number[], v: number) =>
  arr.includes(v) ? (arr.length === 1 ? arr : arr.filter((x) => x !== v)) : [...arr, v].sort((a, b) => b - a);

export const when = (d: number) => (d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);
export const kind = (s: Subscription) => (s.type === 'free_trial' ? 'trial ends' : s.type === 'expires' ? 'expires' : 'renews');

export function badge(s: Subscription) {
  if (s.status !== 'active') return { text: 'cancelled', bg: C.paper, fg: C.ink, hot: false };
  const d = daysUntil(s.next_date);
  const hot = d <= 2;
  return { text: d < 0 ? 'overdue' : d === 0 ? 'today!' : d === 1 ? 'tomorrow' : `in ${d} days`, bg: hot ? C.red : C.white, fg: hot ? C.white : C.ink, hot };
}

// The one-line nag used on the detail card, the test push and the email headline.
export function line(s: Subscription) {
  const w = when(daysUntil(s.next_date));
  if (s.status !== 'active') return 'cancelled. your wallet says thank u 🕊️';
  if (s.type === 'free_trial') return `${s.name} trial ends ${w}. cancel or commit.`;
  if (s.type === 'expires') return `${s.name} expires ${w}. renew or let it go.`;
  return `${s.name} wants ${money(s.price, s.currency)} ${w} 👀`;
}

export const upcoming = (subs: Subscription[], withinDays = 7) =>
  subs
    .filter((s) => s.status === 'active' && daysUntil(s.next_date) >= 0 && daysUntil(s.next_date) <= withinDays)
    .sort((a, b) => a.next_date.localeCompare(b.next_date));

// ---- API ----------------------------------------------------------------

export async function listSubs() {
  // Roll past-due recurring dates first (the hourly cron does the same server-side).
  const roll = await supabase.rpc('roll_due_dates');
  if (roll.error) console.warn('roll_due_dates failed', roll.error.message);
  const { data, error } = await supabase.from('subscriptions').select('*').order('status').order('next_date');
  if (error) throw error;
  return data as Subscription[];
}

export async function saveSub(input: SubInput, id?: string) {
  const q = id ? supabase.from('subscriptions').update(input).eq('id', id) : supabase.from('subscriptions').insert(input);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as Subscription;
}

export async function patchSub(id: string, patch: Partial<SubInput>) {
  const { data, error } = await supabase.from('subscriptions').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Subscription;
}

export async function deleteSub(id: string) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : Array.isArray(v) ? v.join(' ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(subs: Subscription[]) {
  const cols: (keyof Subscription)[] = ['name', 'price', 'currency', 'type', 'billing_cycle', 'custom_days', 'next_date',
    'remind_days_before', 'email_enabled', 'status', 'category', 'portal_url', 'notes'];
  return [cols.join(','), ...subs.map((s) => cols.map((c) => csvCell(s[c])).join(','))].join('\n');
}

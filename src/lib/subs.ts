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
};
export type SubInput = Omit<Subscription, 'id'>;

export const TYPE_LABELS: Record<SubType, string> = {
  auto_renew: 'Auto-renews',
  expires: 'Expires',
  free_trial: 'Free trial',
};
export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom_days: 'Every N days',
  one_time: 'One time',
};

// Dates are calendar days; parse/format in local time so they never shift across zones.
export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => formatDate(new Date());
export const daysUntil = (s: string) => Math.round((parseDate(s).getTime() - parseDate(today()).getTime()) / 86_400_000);

export const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export async function listSubs() {
  // Roll past-due recurring dates first (the hourly cron does the same server-side).
  const roll = await supabase.rpc('roll_due_dates');
  if (roll.error) console.warn('roll_due_dates failed', roll.error.message);
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('status')
    .order('next_date');
  if (error) throw error;
  return data as Subscription[];
}

export async function getSub(id: string) {
  const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Subscription;
}

export async function saveSub(input: SubInput, id?: string) {
  const q = id
    ? supabase.from('subscriptions').update(input).eq('id', id)
    : supabase.from('subscriptions').insert(input);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as Subscription;
}

export async function setStatus(id: string, status: Subscription['status']) {
  const { error } = await supabase.from('subscriptions').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteSub(id: string) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}

const MONTHS_PER_CYCLE: Record<Exclude<BillingCycle, 'custom_days' | 'one_time'>, number> = { monthly: 1, quarterly: 3, yearly: 12 };

// Recurring spend per currency (no FX: mixed currencies are shown side by side).
// Free trials and one-time purchases aren't ongoing spend, so they're left out.
export function monthlyTotals(subs: Subscription[]) {
  const totals: Record<string, number> = {};
  for (const s of subs) {
    if (s.status !== 'active' || s.type === 'free_trial' || s.billing_cycle === 'one_time') continue;
    const perMonth = s.billing_cycle === 'custom_days'
      ? (s.price * 365.25) / 12 / (s.custom_days || 30)
      : s.price / MONTHS_PER_CYCLE[s.billing_cycle];
    totals[s.currency] = (totals[s.currency] ?? 0) + perMonth;
  }
  return totals;
}

export const upcoming = (subs: Subscription[], withinDays = 7) =>
  subs.filter((s) => s.status === 'active' && daysUntil(s.next_date) >= 0 && daysUntil(s.next_date) <= withinDays);

const csvCell = (v: unknown) => {
  const s = v == null ? '' : Array.isArray(v) ? v.join(' ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(subs: Subscription[]) {
  const cols: (keyof Subscription)[] = ['name', 'price', 'currency', 'type', 'billing_cycle', 'custom_days', 'next_date',
    'remind_days_before', 'email_enabled', 'status', 'category', 'portal_url', 'notes'];
  return [cols.join(','), ...subs.map((s) => cols.map((c) => csvCell(s[c])).join(','))].join('\n');
}

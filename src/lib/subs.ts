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

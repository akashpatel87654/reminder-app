import { supabase } from './supabase';

export type Profile = {
  user_id: string;
  email: string;
  timezone: string;
  reminder_hour: number;
  default_remind_days: number[];
  currency: string;
  email_enabled: boolean;
};

export async function getProfile() {
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(patch: Partial<Omit<Profile, 'user_id' | 'email'>>) {
  const { data } = await supabase.auth.getSession();
  const { error } = await supabase.from('profiles').update(patch).eq('user_id', data.session!.user.id);
  if (error) throw error;
}

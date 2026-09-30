import type { Session } from '@supabase/supabase-js';
import { getCalendars } from 'expo-localization';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

type Auth = { session: Session | null; loading: boolean };
const AuthContext = createContext<Auth>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth({ session: data.session, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setAuth({ session, loading: false });
      if (event === 'SIGNED_IN' && session) syncTimezone(session.user.id);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Reminders fire at the user's local hour, so the server needs their zone.
function syncTimezone(userId: string) {
  const timezone = getCalendars()[0]?.timeZone;
  if (timezone) supabase.from('profiles').update({ timezone }).eq('user_id', userId).then();
}

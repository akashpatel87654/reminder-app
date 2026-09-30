import 'expo-sqlite/localStorage/install';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { getProfile, updateProfile, type Profile } from './profile';
import { askPermission, notifState, syncReminders, type NotifState } from './reminders';
import { deleteSub, listSubs, patchSub, saveSub, type SubInput, type Subscription } from './subs';

// Tiny persisted prefs (per device). Reads never throw.
export const pref = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string | null) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};

type Store = {
  subs: Subscription[];
  profile: Profile | null;
  status: 'loading' | 'ready' | 'error';
  offline: boolean; // last fetch failed; showing the cached copy
  notif: NotifState;
  pushOn: boolean;
  refresh: () => Promise<void>;
  save: (input: SubInput, id?: string) => Promise<Subscription>;
  patch: (id: string, p: Partial<SubInput>) => Promise<Subscription>;
  remove: (id: string) => Promise<void>;
  setProfile: (p: Partial<Omit<Profile, 'user_id' | 'email'>>) => Promise<void>;
  requestNotif: () => Promise<boolean>;
  setPushOn: (on: boolean) => void;
  checkNotif: () => Promise<{ state: NotifState; canAsk: boolean }>;
};

const StoreContext = createContext<Store | null>(null);
export const useStore = () => useContext(StoreContext)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const cacheKey = `cache:${uid}`;
  const cached = useMemo(() => {
    try { return JSON.parse(pref.get(cacheKey) ?? 'null') as { subs: Subscription[]; profile: Profile } | null; } catch { return null; }
  }, [cacheKey]);

  const [subs, setSubs] = useState<Subscription[]>(cached?.subs ?? []);
  const [profile, setProfileState] = useState<Profile | null>(cached?.profile ?? null);
  const [status, setStatus] = useState<Store['status']>(cached ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [notif, setNotif] = useState<NotifState>('undetermined');
  const [pushOn, setPushOnState] = useState(pref.get('pushOff') !== '1');
  const latest = useRef({ subs, profile, notif, pushOn });
  latest.current = { subs, profile, notif, pushOn };

  const resync = useCallback((list = latest.current.subs) => {
    const { profile: p, notif: n, pushOn: on } = latest.current;
    syncReminders(list, p?.reminder_hour ?? 9, n === 'granted' && on);
  }, []);

  // Every mutation goes through here: state, offline cache, and scheduled reminders stay in step.
  const commit = useCallback((next: Subscription[], p = latest.current.profile) => {
    setSubs(next);
    latest.current.subs = next;
    if (p) pref.set(cacheKey, JSON.stringify({ subs: next, profile: p }));
    resync(next);
  }, [cacheKey, resync]);

  const checkNotif = useCallback(async () => {
    const r = await notifState();
    setNotif(r.state);
    latest.current.notif = r.state;
    return r;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [list, p] = await Promise.all([listSubs(), getProfile()]);
      setProfileState(p);
      latest.current.profile = p;
      setOffline(false);
      setStatus('ready');
      await checkNotif();
      commit(list, p);
    } catch (e) {
      console.warn('refresh failed', e);
      setOffline(true);
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [commit, checkNotif]);

  useEffect(() => {
    if (!uid) return;
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [uid, refresh]);

  const store: Store = {
    subs, profile, status, offline, notif, pushOn, refresh, checkNotif,
    save: async (input, id) => {
      const saved = await saveSub(input, id);
      const cur = latest.current.subs;
      commit(id ? cur.map((s) => (s.id === id ? saved : s)) : [...cur, saved]);
      return saved;
    },
    patch: async (id, p) => {
      const saved = await patchSub(id, p);
      commit(latest.current.subs.map((s) => (s.id === id ? saved : s)));
      return saved;
    },
    remove: async (id) => {
      await deleteSub(id);
      commit(latest.current.subs.filter((s) => s.id !== id));
    },
    setProfile: async (patch) => {
      const prev = latest.current.profile;
      if (!prev) return;
      const next = { ...prev, ...patch };
      setProfileState(next); // optimistic: settings toggles feel instant
      latest.current.profile = next;
      try {
        await updateProfile(patch);
        commit(latest.current.subs, next);
      } catch (e) {
        setProfileState(prev);
        latest.current.profile = prev;
        throw e;
      }
    },
    requestNotif: async () => {
      const ok = await askPermission();
      await checkNotif();
      resync();
      return ok;
    },
    setPushOn: (on) => {
      pref.set('pushOff', on ? null : '1');
      setPushOnState(on);
      latest.current.pushOn = on;
      resync();
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

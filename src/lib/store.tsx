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
  // Mutations resolve `queued: true` when there was no connection: the change is already on
  // screen and in the offline queue, and syncs on the next successful refresh.
  save: (input: SubInput, id?: string) => Promise<{ sub: Subscription; queued: boolean }>;
  patch: (id: string, p: Partial<SubInput>) => Promise<{ queued: boolean }>;
  remove: (id: string) => Promise<{ queued: boolean }>;
  setProfile: (p: ProfilePatch) => Promise<{ queued: boolean }>;
  requestNotif: () => Promise<boolean>;
  setPushOn: (on: boolean) => void;
  checkNotif: () => Promise<{ state: NotifState; canAsk: boolean }>;
};

type ProfilePatch = Partial<Omit<Profile, 'user_id' | 'email'>>;
type Op =
  | { kind: 'insert'; id: string; input: SubInput }
  | { kind: 'update'; id: string; patch: Partial<SubInput> }
  | { kind: 'delete'; id: string }
  | { kind: 'profile'; patch: ProfilePatch };

export const isNetworkError = (e: unknown) => /network|fetch|timed? ?out|offline|abort/i.test(String((e as Error)?.message ?? e));
const isTemp = (id: string) => id.startsWith('local-');

const StoreContext = createContext<Store | null>(null);
export const useStore = () => useContext(StoreContext)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const cacheKey = `cache:${uid}`;
  const queueKey = `queue:${uid}`;
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

  const loadQueue = useCallback((): Op[] => {
    try { return JSON.parse(pref.get(queueKey) ?? '[]'); } catch { return []; }
  }, [queueKey]);
  const saveQueue = useCallback((q: Op[]) => pref.set(queueKey, q.length ? JSON.stringify(q) : null), [queueKey]);

  // Replay offline changes in order. Stops (and keeps the rest) on a network error; drops an op
  // the server rejects (e.g. the row was deleted on another device) so one bad op can't block the queue.
  const flush = useCallback(async () => {
    let q = loadQueue();
    while (q.length) {
      const op = q[0];
      let rest = q.slice(1);
      try {
        if (op.kind === 'insert') {
          const real = (await saveSub(op.input)).id;
          rest = rest.map((o) => ('id' in o && o.id === op.id ? { ...o, id: real } : o));
        } else if (op.kind === 'update') await patchSub(op.id, op.patch);
        else if (op.kind === 'delete') await deleteSub(op.id);
        else await updateProfile(op.patch);
      } catch (e) {
        if (isNetworkError(e)) throw e;
        console.warn('dropping offline change the server rejected', op, e);
      }
      q = rest;
      saveQueue(q);
    }
  }, [loadQueue, saveQueue]);

  const refresh = useCallback(async () => {
    try {
      await flush();
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
  }, [commit, checkNotif, flush]);

  useEffect(() => {
    if (!uid) return;
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [uid, refresh]);

  // Try online; on no connection (or with older changes still queued, to keep order) queue the op
  // and apply it locally instead. Returns true when queued. Other errors propagate to the caller.
  async function attempt(online: () => Promise<unknown>, op: Op, applyLocal: () => void) {
    const q = loadQueue();
    // A change to something created offline has to wait for that insert.
    const mustQueue = q.length > 0 || ('id' in op && isTemp(op.id) && op.kind !== 'insert');
    if (!mustQueue) {
      try {
        await online();
        return false;
      } catch (e) {
        if (!isNetworkError(e)) throw e;
      }
    }
    saveQueue([...q, op]);
    applyLocal();
    setOffline(true);
    return true;
  }

  const store: Store = {
    subs, profile, status, offline, notif, pushOn, refresh, checkNotif,
    save: async (input, id) => {
      const cur = latest.current.subs;
      const local = { ...input, id: id ?? `local-${Date.now()}-${Math.round(Math.random() * 1e6)}` } as Subscription;
      const queued = await attempt(
        async () => {
          const saved = await saveSub(input, id);
          commit(id ? cur.map((s) => (s.id === id ? saved : s)) : [...cur, saved]);
          local.id = saved.id;
        },
        id ? { kind: 'update', id, patch: input } : { kind: 'insert', id: local.id, input },
        () => commit(id ? cur.map((s) => (s.id === id ? local : s)) : [...cur, local]),
      );
      return { sub: queued ? local : latest.current.subs.find((s) => s.id === local.id) ?? local, queued };
    },
    patch: async (id, p) => ({
      queued: await attempt(
        async () => {
          const saved = await patchSub(id, p);
          commit(latest.current.subs.map((s) => (s.id === id ? saved : s)));
        },
        { kind: 'update', id, patch: p },
        () => commit(latest.current.subs.map((s) => (s.id === id ? { ...s, ...p } : s))),
      ),
    }),
    remove: async (id) => ({
      queued: await attempt(
        async () => {
          await deleteSub(id);
          commit(latest.current.subs.filter((s) => s.id !== id));
        },
        { kind: 'delete', id },
        () => commit(latest.current.subs.filter((s) => s.id !== id)),
      ),
    }),
    setProfile: async (patch) => {
      const prev = latest.current.profile;
      if (!prev) return { queued: false };
      const next = { ...prev, ...patch };
      setProfileState(next); // optimistic: settings toggles feel instant
      latest.current.profile = next;
      try {
        const queued = await attempt(() => updateProfile(patch), { kind: 'profile', patch }, () => {});
        commit(latest.current.subs, next);
        return { queued };
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

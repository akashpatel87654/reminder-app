# Ledger

Work log for SubTrack. One line per task; decisions and known gaps below.

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| T1 Project setup | done | — | Expo SDK 57, Expo Router (`src/app`), Supabase client w/ expo-sqlite localStorage |
| T2 Auth | todo | | |
| T3 Subscription CRUD | todo | | |
| T4 Home summary | todo | | |
| T5 Local push reminders | todo | | |
| T6 Auto-roll dates | todo | | |
| T7 Email reminders | todo | | |
| T8 Settings | todo | | |
| T9 Release | todo | | |

## Decisions
- Defaults for open questions: login + email (as spec), iOS + Android, INR default with per-sub currency.
- `react-dom` pinned to 19.2.3 via `overrides` — expo's optional peer pulled 19.3.0 which conflicts with react 19.2.3.
- No tests (owner's call). Verification = `npm run typecheck` + `npx expo export`.
- Design pending from owner; screens use plain RN styles until it lands.

## Needs owner
- Supabase project: fill `.env` from `.env.example`, run `supabase/migrations/*.sql`.

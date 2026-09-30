# Ledger

Work log for SubTrack. One line per task; decisions and known gaps below.

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| T1 Project setup | done | ab276ac | Expo SDK 57, Expo Router (`src/app`), Supabase client w/ expo-sqlite localStorage |
| T2 Auth | done | — | Email OTP (code, not link); profile row via `auth.users` trigger; timezone synced on sign-in; `Stack.Protected` guards |
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
- Supabase Auth → Email Templates → "Magic Link" must include `{{ .Token }}` so users get a 6-digit code (app verifies codes, no deep links).
- Custom SMTP (Resend) recommended in Supabase Auth — the built-in mailer is rate-limited to a few emails/hour.

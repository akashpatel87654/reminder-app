# Ledger

Work log for SubTrack. One line per task; decisions and known gaps below.

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| T1 Project setup | done | ab276ac | Expo SDK 57, Expo Router (`src/app`), Supabase client w/ expo-sqlite localStorage |
| T2 Auth | done | 76df0f3 | Email OTP (code, not link); profile row via `auth.users` trigger; timezone synced on sign-in; `Stack.Protected` guards |
| T3 Subscription CRUD | done | 7983d42 | List (sorted, due badges, red ≤2d), add/edit form at `sub/[id]` (`new` = create), long-press → cancel/reactivate/delete; RLS own-rows |
| T4 Home summary | done | e0b8493 | Per-currency /mo + /yr totals (no FX); excludes free trials, one-time, cancelled; next-7-days line |
| T5 Local push reminders | done | 9490a3a | Full resync on every list load (cancel all → reschedule); past-due fires once (handled keys in localStorage); iOS cap 60 soonest; tap → sub; sign-out clears |
| T6 Auto-roll dates | done | ec30d2e | `roll_due_dates()` SQL: app RPC before every list load + hourly pg_cron; trial→auto_renew on roll; one_time never rolls |
| T7 Email reminders | done | 8c050c0 | `claim_email_reminders()` SQL (insert into log = lock + dedupe) → `send-reminders` edge fn → Resend; failed send releases claim; HMAC one-click unsubscribe; cron every 15 min |
| T8 Settings | done | 7651d51 | Reminder hour, default days/currency (prefill new subs), global email toggle, CSV via native share sheet, `delete_account()` RPC, logout |
| T9 Release | partial | — | `eas.json` (preview + production), `PRIVACY.md`, expo-doctor 21/21. Waiting on: design (icon, splash), EAS login, store accounts |

## Decisions
- Defaults for open questions: login + email (as spec), iOS + Android, INR default with per-sub currency.
- `react-dom` pinned to 19.2.3 via `overrides` — expo's optional peer pulled 19.3.0 which conflicts with react 19.2.3.
- No tests (owner's call). Verification = `npm run typecheck` + `npx expo export`.
- Design pending from owner; screens use plain RN styles until it lands.

## Needs owner
- Supabase project: fill `.env` from `.env.example`, run `supabase/migrations/*.sql` in order.
- Enable extensions `pg_cron` + `pg_net`; add Vault secrets `project_url`, `cron_secret` (see 0003_cron.sql).
- Deploy email function: `supabase functions deploy send-reminders` and set secrets
  `CRON_SECRET` (= vault cron_secret), `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `SubTrack <reminders@yourdomain>`, domain verified in Resend).
- Supabase Auth → Email Templates → "Magic Link" must include `{{ .Token }}` so users get a 6-digit code (app verifies codes, no deep links).
- Custom SMTP (Resend) recommended in Supabase Auth — the built-in mailer is rate-limited to a few emails/hour.
- No server push (Expo push token) in v1: local notifications cover the app channel, email covers the backup. Add push token + server send if users report missed reminders when they never open the app for 60+ reminders' worth of time.
- Local notifications work in Expo Go; server push would need a dev build.
- Release: `npx eas-cli@latest login` → `npx eas-cli@latest build --profile preview --platform all` for internal testers; host PRIVACY.md at a public URL for the store listings and fill the support email.

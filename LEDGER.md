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
| T9 Release | partial | 4c0dafd | `eas.json` (preview + production), `PRIVACY.md`, expo-doctor 21/21. Icon/splash now from design. Waiting on: EAS login, store accounts |
| D1 Design pass | done | — | Owner's design (SubTrack App (offline).html) built natively: splash, onboarding, login/OTP, home, subs (swipe rows), add/edit + calendar sheet, detail, stats, email preview, settings, privacy, error, permission + notifs-off sheets, confirm modal, toasts, confetti. Bricolage Grotesque + DM Mono via expo-google-fonts. Email + unsubscribe page restyled to match (+ POST-only undo/resubscribe). `color` column (0006). |

| D2 Sign-in code email | done | — | `supabase/templates/login-code.html` (design-styled, shows `{{ .Token }}`) wired for Magic Link + Confirm signup in config.toml; verified locally: returning + new user both receive a code and verify |

| D3 Unsubscribe on hosted Supabase | done | — | Supabase rewrites text/html GETs to text/plain without a custom domain (confirmed in their limits docs). Default now = readable plain-text confirmation (undo = in-app toggle); `PUBLIC_FUNCTION_URL` (custom domain) switches links + styled HTML page with undo. Deleted sub → 404 instead of 500. Verified vs local DB: unsub flips flag, 404 path, HTML mode, POST resub |

| D4 Month-end drift | done | — | 0007: `anchor_day` (trigger sets it from user-picked dates; roll flags its own updates so it keeps it). Monthly/quarterly/yearly land on the anchor clamped to month length: Jan 31 → Feb 28 → Mar 31; Feb 29 yearly → Feb 28 off-leap. Verified in local DB incl. as `authenticated` role |

| D5 Offline changes | done | — | Store queues add/edit/cancel/delete/settings when there's no connection (per-user queue in localStorage), applies them on screen at once ("saved offline ✦" toast), replays in order on next refresh (app open, foreground, or every 30s while offline); offline-created subs get `local-*` ids remapped on sync; server-rejected ops are dropped, not blocking. Also: 10s request timeout (a hung connection used to spin forever). Verified in web preview with the API container paused: add + cancel offline → survive reload → sync to DB with correct ids |

| D6 Android run | done | — | Native debug build on Android 15 emulator (Pixel 7). Verified: splash, onboarding, code login, ask-first sheet → system prompt → granted, reminder notification posted, swipe row → delete via confirm modal (gone from DB), add form. Fixed 3 Android bugs: keyboard covered login field (decoration folds away while typing; `behavior="padding"` on both platforms), Android 13+ reports notification permission `denied` before first ask (now treated as not-asked when it can still ask — was showing a false "notifs are off" banner and skipping the ask sheet), form content ran under the status bar. Keyboard + status-bar fixes re-checked on iOS with the on-screen keyboard |

| D7 Accessibility pass | done | e605519..01ffb91 | Contrast: 4 text colours failed WCAG AA (worst 2.6:1) → all ≥4.5:1 (`red`, `redInk`, new `blueBtn`, `placeholder` tokens). Touch targets: small chips/toggles/links padded to 44pt via hitSlop. Screen readers: row actions (Cancel/Delete) instead of swipe, summary labels, headers, announced toasts, decoration hidden. Reduce Motion honoured (verified by frame diff on/off). Large text: capped scaling on display type, login/home cards reflow (checked at largest iOS size) |

## Decisions
- Defaults for open questions: login + email (as spec), iOS + Android, INR default with per-sub currency.
- `react-dom` pinned to 19.2.3 via `overrides` — expo's optional peer pulled 19.3.0 which conflicts with react 19.2.3.
- No tests (owner's call). Verification = `npm run typecheck` + `npx expo export` + web preview against local Supabase.
- Local dev: `npx supabase start` (Docker) applies all migrations; `.env` → `http://127.0.0.1:54321` + local publishable key; `npx expo start --web` for a browser preview. Local sign-in codes land in Mailpit (http://127.0.0.1:54324). Web deps (react-native-web, react-dom, @expo/metro-runtime) are only for this preview.
- Android: Expo Go can't load `expo-notifications` since SDK 53, so Android runs need the real build: `npm run android` (= `expo run:android`). Needs JDK 17 (`JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`) — Android Studio's bundled Java 25 breaks the native (prefab) step. For local Supabase from the emulator: `adb reverse tcp:54321 tcp:54321`.
- Device run (iOS 26.5 simulator, Expo Go, iPhone 17 Pro): verified natively — onboarding swipe paging, email-code login (branded email → code → in), "can we nag you?" sheet → real iOS permission prompt, fire-now reminder banner, swipe row → cancel (toast, dimmed row), test nag banner → tap opens that sub's detail, settings reflects granted push. Fixed: scroll content ran under the status bar.
- Design deviations (deliberate): no "load demo subs" and no "use demo code" (prototype-only, would write fake data into real accounts); no "simulate offline" toggle; added CATEGORY chips + MANAGE LINK field to the form (design shows both on detail but had no input); quick-pick fills name/color/category but not price (design's USD prices are wrong for INR users); privacy copy drops "push token"/"Expo" since reminders are local notifications.
- Totals across currencies use fixed USD rates (USD/EUR/GBP/INR, like the design); marked `ponytail:` in subs.ts.
- Shared state: `src/lib/store.tsx` (subs + profile + notif permission), cached per user in localStorage for offline reads; every mutation resyncs local notifications.

## Needs owner
- Supabase project: fill `.env` from `.env.example`, run `supabase/migrations/*.sql` in order.
- Enable extensions `pg_cron` + `pg_net`; add Vault secrets `project_url`, `cron_secret` (see 0003_cron.sql).
- Deploy email function: `supabase functions deploy send-reminders` and set secrets
  `CRON_SECRET` (= vault cron_secret), `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `SubTrack <reminders@yourdomain>`, domain verified in Resend).
- Hosted Supabase: Auth → Email Templates → paste `supabase/templates/login-code.html` into BOTH "Magic Link" and "Confirm signup" (subject: `your SubTrack code`). Without it users get a link, not the 6-digit code the app asks for.
- Custom SMTP (Resend) recommended in Supabase Auth — the built-in mailer is rate-limited to a few emails/hour.
- Server push is blocked on EAS login (needs an EAS projectId for push tokens). No server push in v1: local notifications cover the app channel, email covers the backup. Add push token + server send if users report missed reminders when they never open the app for 60+ reminders' worth of time.
- Local notifications work in Expo Go; server push would need a dev build.
- Optional: Supabase custom domain → set function secret `PUBLIC_FUNCTION_URL=https://<domain>/functions/v1/send-reminders` to get the styled unsubscribe page with undo.
- Contact email (privacy screen + PRIVACY.md): heatmonks.venture@gmail.com. Not usable as Resend `EMAIL_FROM` — Resend only sends from a verified domain.
- Release: `npx eas-cli@latest login` → `npx eas-cli@latest build --profile preview --platform all` for internal testers; host PRIVACY.md at a public URL for the store listings.

# Pingo — Subscription Reminder App

## Stack
- App: React Native + Expo (iOS + Android, one codebase), Expo Router
- Backend: Supabase (auth, Postgres, scheduled edge function)
- Push: expo-notifications (local scheduled) + Expo Push (server fallback)
- Email: Resend

## Data model
subscriptions
- id, user_id
- name, portal_url (optional), category
- price, currency
- type: auto_renew | expires | free_trial
- billing_cycle: monthly | quarterly | yearly | custom_days | one_time
- next_date (date), custom_days (nullable)
- remind_days_before: int[] default {2}
- email_enabled bool default true
- status: active | cancelled
- notes, created_at

notification_log
- subscription_id, due_date, days_before, channel (push|email), sent_at
- UNIQUE(subscription_id, due_date, days_before, channel)

profiles
- user_id, email, timezone, reminder_hour default 9, default_remind_days, currency, email_enabled, expo_push_token

## Tasks
- T1 Project setup — Expo TS app, Supabase client, env config
- T2 Auth — email OTP via Supabase, profile auto-created, timezone captured
- T3 Subscription CRUD — form, list sorted by next_date, cancel/delete, RLS
- T4 Home summary — monthly/yearly totals, upcoming 7 days
- T5 Local push reminders — schedule at reminder_hour local, fire-now if past, reschedule on edit, tap opens sub
- T6 Auto-roll recurring dates — on app open + daily server job
- T7 Email reminders — hourly edge function, notification_log dedupe, Resend, unsubscribe link
- T8 Settings — defaults, email toggle, CSV export, delete account
- T9 Release — icons, splash, privacy policy, EAS build

## Out of scope (v1)
Gmail receipt parsing, bank SMS parsing, family sharing, widgets, payments

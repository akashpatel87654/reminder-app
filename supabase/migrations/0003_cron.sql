-- Needs pg_cron (Supabase: Database → Extensions). Hourly because users span timezones.
create extension if not exists pg_cron;
select cron.schedule('roll-due-dates', '5 * * * *', 'select public.roll_due_dates()');

-- Email reminders. Needs pg_net and two Vault secrets (Project Settings → Vault):
--   project_url  = https://<ref>.supabase.co
--   cron_secret  = same value as the function's CRON_SECRET
-- Every 15 min so half-hour timezones (IST) get mail close to their reminder hour.
create extension if not exists pg_net;
select cron.schedule('send-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object('x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
  );
$$);

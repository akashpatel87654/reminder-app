-- Needs pg_cron (Supabase: Database → Extensions). Hourly because users span timezones.
create extension if not exists pg_cron;
select cron.schedule('roll-due-dates', '5 * * * *', 'select public.roll_due_dates()');

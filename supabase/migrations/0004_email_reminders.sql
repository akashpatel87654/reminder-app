-- Claim the email reminders due right now and return what to send.
-- Due = user's local hour has reached reminder_hour, and the nearest threshold d with
-- d >= days-left hasn't been emailed for this due date. Using ">=" (not "=") means a missed
-- cron run catches up, and a subscription added inside the window still gets one email.
-- The insert IS the lock: concurrent runs can't both claim a row (unique constraint).
create function public.claim_email_reminders()
returns table (subscription_id uuid, due_date date, days_before int, days_left int, email text,
               name text, price numeric, currency text, type public.sub_type, portal_url text)
language sql security definer set search_path = '' as $$
  with local as (
    select p.user_id, p.email, p.reminder_hour, now() at time zone p.timezone as ts
    from public.profiles p
    where p.email_enabled
  ), due as (
    select s.id, s.next_date, s.name, s.price, s.currency, s.type, s.portal_url, l.email,
           s.next_date - l.ts::date as days_left,
           (select min(d) from unnest(s.remind_days_before) d where d >= s.next_date - l.ts::date) as d
    from public.subscriptions s
    join local l on l.user_id = s.user_id
    where s.status = 'active' and s.email_enabled
      and s.next_date >= l.ts::date
      and extract(hour from l.ts) >= l.reminder_hour
  ), claimed as (
    insert into public.notification_log (subscription_id, due_date, days_before, channel)
    select id, next_date, d, 'email' from due where d is not null
    on conflict do nothing
    returning notification_log.subscription_id, notification_log.due_date, notification_log.days_before
  )
  select c.subscription_id, c.due_date, c.days_before, due.days_left, due.email,
         due.name, due.price, due.currency, due.type, due.portal_url
  from claimed c join due on due.id = c.subscription_id;
$$;

revoke execute on function public.claim_email_reminders() from public, anon, authenticated;

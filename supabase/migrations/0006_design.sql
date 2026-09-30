-- Design pass: each subscription has a card color; category defaults like the design.
alter table public.subscriptions add column color text not null default '#FF7AC6' check (color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.subscriptions alter column category set default 'Other';

-- Email template needs color + cycle; return type change requires drop/create.
drop function public.claim_email_reminders();
create function public.claim_email_reminders()
returns table (subscription_id uuid, due_date date, days_before int, days_left int, email text,
               name text, price numeric, currency text, type public.sub_type, portal_url text,
               color text, billing_cycle public.billing_cycle, reminder_hour smallint)
language sql security definer set search_path = '' as $$
  with local as (
    select p.user_id, p.email, p.reminder_hour, now() at time zone p.timezone as ts
    from public.profiles p
    where p.email_enabled
  ), due as (
    select s.id, s.next_date, s.name, s.price, s.currency, s.type, s.portal_url, s.color, s.billing_cycle,
           l.email, l.reminder_hour,
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
         due.name, due.price, due.currency, due.type, due.portal_url,
         due.color, due.billing_cycle, due.reminder_hour
  from claimed c join due on due.id = c.subscription_id;
$$;

revoke execute on function public.claim_email_reminders() from public, anon, authenticated;

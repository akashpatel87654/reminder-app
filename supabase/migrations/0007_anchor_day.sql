-- Month-end drift fix: remember the billing day (e.g. 31) and clamp it per month,
-- so Jan 31 → Feb 28 → Mar 31 instead of sticking at the 28th.
alter table public.subscriptions add column anchor_day smallint check (anchor_day between 1 and 31);
update public.subscriptions set anchor_day = extract(day from next_date);

-- A date the user sets becomes the new anchor; roll_due_dates() flags its own updates so it doesn't.
create function public.set_anchor_day() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or (new.next_date is distinct from old.next_date and current_setting('subtrack.rolling', true) is distinct from 'on') then
    new.anchor_day := extract(day from new.next_date);
  end if;
  return new;
end $$;
create trigger subscriptions_anchor_day before insert or update of next_date on public.subscriptions
  for each row execute function public.set_anchor_day();

-- First cycle date on/after `today`. Month-based cycles land on the anchor day, clamped to the month's length.
create or replace function public.next_cycle_date(d date, cycle public.billing_cycle, custom int, today date, anchor int) returns date
language plpgsql immutable as $$
declare
  months int := case cycle when 'monthly' then 1 when 'quarterly' then 3 when 'yearly' then 12 end;
  base date := date_trunc('month', d)::date;
  m date;
  cand date;
  n int := 0;
begin
  if d >= today or cycle = 'one_time' then return d; end if;
  if cycle = 'custom_days' then
    return d + (ceil((today - d)::numeric / custom) * custom)::int;
  end if;
  loop
    n := n + 1;
    m := (base + make_interval(months => n * months))::date;
    cand := m + (least(coalesce(anchor, extract(day from d)::int), extract(day from (m + interval '1 month - 1 day'))::int) - 1);
    exit when cand >= today;
  end loop;
  return cand;
end $$;

create or replace function public.roll_due_dates() returns void
language sql security invoker set search_path = '' as $$
  select set_config('subtrack.rolling', 'on', true);
  update public.subscriptions s set
    next_date = public.next_cycle_date(s.next_date, s.billing_cycle, s.custom_days, (now() at time zone p.timezone)::date, s.anchor_day),
    type = case when s.type = 'free_trial' then 'auto_renew'::public.sub_type else s.type end
  from public.profiles p
  where p.user_id = s.user_id
    and s.status = 'active'
    and s.billing_cycle <> 'one_time'
    and s.next_date < (now() at time zone p.timezone)::date;
  select set_config('subtrack.rolling', 'off', true);
$$;

drop function public.next_cycle_date(date, public.billing_cycle, int, date);

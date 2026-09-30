-- First cycle date on/after `today`, stepping from `d` in whole cycles.
-- Computed as d + n*step (not repeated +step) so Jan 31 + 2 months = Mar 31 within one roll.
-- ponytail: month-end dates still drift across separate rolls (Jan 31 → Feb 28 → Mar 28); store an anchor day if that matters.
create function public.next_cycle_date(d date, cycle billing_cycle, custom int, today date) returns date
language plpgsql immutable as $$
declare
  step interval := case cycle
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    when 'yearly' then interval '1 year'
    when 'custom_days' then make_interval(days => custom)
  end;
  n int := 1;
begin
  if step is null or d >= today then return d; end if;
  while (d + n * step)::date < today loop n := n + 1; end loop;
  return (d + n * step)::date;
end $$;

-- Advance past-due recurring subscriptions. A free trial that ran out is now a paid renewal.
-- Security invoker: from the app RLS limits it to the caller's rows; the cron job rolls everyone.
create function public.roll_due_dates() returns void
language sql security invoker set search_path = '' as $$
  update public.subscriptions s set
    next_date = public.next_cycle_date(s.next_date, s.billing_cycle, s.custom_days, (now() at time zone p.timezone)::date),
    type = case when s.type = 'free_trial' then 'auto_renew'::public.sub_type else s.type end
  from public.profiles p
  where p.user_id = s.user_id
    and s.status = 'active'
    and s.billing_cycle <> 'one_time'
    and s.next_date < (now() at time zone p.timezone)::date;
$$;

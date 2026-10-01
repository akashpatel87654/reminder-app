-- When the subscription was bought / started. Optional; for recurring plans the app uses it
-- to work out the next renewal date.
alter table public.subscriptions add column start_date date;

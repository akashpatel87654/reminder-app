-- SubTrack schema. Run in Supabase SQL editor (or `supabase db push`).

create type sub_type as enum ('auto_renew', 'expires', 'free_trial');
create type billing_cycle as enum ('monthly', 'quarterly', 'yearly', 'custom_days', 'one_time');

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  email text not null,
  timezone text not null default 'Asia/Kolkata',
  reminder_hour smallint not null default 9 check (reminder_hour between 0 and 23),
  default_remind_days int[] not null default '{2}',
  currency text not null default 'INR',
  email_enabled boolean not null default true,
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(trim(name)) > 0),
  portal_url text,
  category text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'INR',
  type sub_type not null default 'auto_renew',
  billing_cycle billing_cycle not null default 'monthly',
  custom_days int check (custom_days > 0),
  next_date date not null,
  remind_days_before int[] not null default '{2}',
  email_enabled boolean not null default true,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  check (billing_cycle <> 'custom_days' or custom_days is not null)
);
create index on public.subscriptions (user_id, next_date);

-- Written only by the server job (service role); no client policies.
create table public.notification_log (
  subscription_id uuid not null references public.subscriptions on delete cascade,
  due_date date not null,
  days_before int not null,
  channel text not null check (channel in ('push', 'email')),
  sent_at timestamptz not null default now(),
  unique (subscription_id, due_date, days_before, channel)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_log enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);
create policy "own subscriptions" on public.subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

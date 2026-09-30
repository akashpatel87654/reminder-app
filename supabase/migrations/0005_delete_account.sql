-- Store-required account deletion. Cascades to profile, subscriptions and log.
create function public.delete_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

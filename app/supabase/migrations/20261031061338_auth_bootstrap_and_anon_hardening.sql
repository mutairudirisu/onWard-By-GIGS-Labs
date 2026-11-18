-- onWard · auth bootstrap + privilege hardening
-- 1. every signup (email or Google) gets a profiles row
-- 2. anon loses the write/TRUNCATE grants RLS cannot govern
-- 3. the public portfolio read path actually resolves

-- ------------------------------------------------------------ profile bootstrap
create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_name  text;
  v_parts text[];
begin
  v_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), ''),
      'onWard member'
    ),
    80
  );
  v_parts := regexp_split_to_array(v_name, '\s+');

  insert into public.profiles (id, display_name, initials, avatar_url)
  values (
    new.id,
    v_name,
    upper(left(v_parts[1], 1)) || coalesce(nullif(left(v_parts[2], 1), ''), ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

alter function internal.handle_new_user() owner to postgres;

revoke all on function internal.handle_new_user() from public, anon, authenticated;
grant execute on function internal.handle_new_user() to postgres, supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function internal.handle_new_user();

-- backfill users that signed up before the trigger existed
insert into public.profiles (id, display_name, initials, avatar_url)
select
  u.id,
  n.name,
  upper(left(p.parts[1], 1)) || coalesce(nullif(left(p.parts[2], 1), ''), ''),
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
cross join lateral (
  select left(
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), ''),
      'onWard member'
    ),
    80
  ) as name
) n
cross join lateral (select regexp_split_to_array(n.name, '\s+') as parts) p
on conflict (id) do nothing;

-- ------------------------------------------------------------ anon hardening
-- RLS governs select/insert/update/delete only. TRUNCATE, REFERENCES, TRIGGER
-- and MAINTAIN are privilege-only, so the blanket anon grant has to go.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'tasks', 'notes', 'skills', 'on_wards', 'ward_skills',
    'evidence', 'activity_days', 'streaks', 'user_settings', 'portfolio_shares'
  ]
  loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end
$$;

grant select on public.profiles, public.portfolio_shares to anon;

-- the profiles policy runs an EXISTS against portfolio_shares as the invoking
-- role, so anon needs a readable path there or the subquery is always empty.
drop policy if exists "public shares readable" on public.portfolio_shares;
create policy "public shares readable" on public.portfolio_shares
  for select to anon
  using (is_public);

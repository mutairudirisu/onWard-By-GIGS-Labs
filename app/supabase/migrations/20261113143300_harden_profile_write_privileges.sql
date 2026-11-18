begin;

-- Profile rows are provisioned by the auth trigger; clients may update only
-- their approved profile fields and cannot create or delete account records.
revoke all on table public.profiles from public, anon, authenticated;
revoke all (display_name, initials, role, location, bio, avatar_url, username)
  on table public.profiles
  from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, initials, role, location, bio, avatar_url, username)
  on table public.profiles
  to authenticated;

drop policy if exists "owner insert" on public.profiles;
drop policy if exists "owner delete" on public.profiles;

commit;

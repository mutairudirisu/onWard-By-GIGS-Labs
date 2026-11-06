-- The console bootstrapped with a single owner; this is the operator list.
-- Rows land here from the dashboard SQL editor only — public.admins has no RLS
-- policies on purpose, so no signed-in user can read it or grant themselves.
-- Replace the placeholder with a User UID from Authentication -> Users before
-- running it; an unedited placeholder is not a valid uuid, so a stray copy of
-- this file fails loudly instead of silently granting nothing.
insert into public.admins (user_id)
values ('<operator-uid-here>')
on conflict (user_id) do nothing;

-- to check afterwards:
--   select user_id, created_at from public.admins order by created_at;

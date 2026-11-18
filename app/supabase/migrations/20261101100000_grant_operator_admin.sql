-- The console bootstrapped with a single owner; this is the operator list.
-- Rows land here from the dashboard SQL editor only — public.admins has no RLS
-- policies on purpose, so no signed-in user can read it or grant themselves.
-- The UID below is Mutairu Dirisu's own auth.users id, read off the signed-in
-- session, so re-check it against Authentication -> Users before running this
-- for anybody else: a wrong id here is a quiet grant of the whole console.
insert into public.admins (user_id)
values ('3553cc39-3850-45b2-898c-e17a59d82c87')
on conflict (user_id) do nothing;

-- to check afterwards:
--   select user_id, created_at from public.admins order by created_at;

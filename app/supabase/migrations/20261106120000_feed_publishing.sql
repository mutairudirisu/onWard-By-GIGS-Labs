-- Publishing an onWard makes its text readable by strangers, so this ships three
-- things at once: the flag, a view that exposes only what a feed needs, and the
-- removal of the anonymous read that used to hand over whole profile rows.
begin;

alter table public.on_wards
  add column if not exists published boolean not null default false;

create index if not exists on_wards_published_day_idx
  on public.on_wards (day desc)
  where published;

-- A first name and initials, never the row: profiles also holds referral_code,
-- referred_by and pro_until, which nobody outside the account should see.
create or replace view public.feed_posts
with (security_barrier = true)
as
select
  w.id,
  w.day,
  w.created_at,
  w.title,
  w.impact,
  left(w.body, 400) as detail,
  split_part(p.display_name, ' ', 1) as first_name,
  p.initials
from public.on_wards w
join public.profiles p on p.id = w.user_id
where w.published;

-- A view runs with its owner's privileges, and the owner of these tables is not
-- subject to the per-user policies. So granting select on the view is what makes a
-- post public - it does not open the tables behind it.
grant select on public.feed_posts to anon, authenticated;

-- The shared-portfolio read gave anonymous callers every column of profiles, and no
-- screen uses it: there is no public portfolio link, only a PDF you send yourself.
drop policy if exists "public portfolio read" on public.profiles;
revoke select on public.profiles from anon;

commit;

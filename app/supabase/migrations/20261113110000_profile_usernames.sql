begin;

alter table public.profiles
  add column username text,
  add constraint profiles_username_format
    check (
      username is null
      or (
        username = lower(username)
        and username ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'
      )
    );

create unique index profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

grant update (username) on public.profiles to authenticated;

create or replace view public.profile_cards
with (security_barrier = true)
as
select
  pf.id,
  pf.display_name as full_name,
  coalesce(
    nullif(btrim(upper(pf.initials)), ''),
    upper(left(btrim(pf.display_name), 1))
  ) as initials,
  pf.avatar_url,
  pf.role,
  pf.location,
  pf.bio,
  pf.created_at as joined_at,
  (pf.id = auth.uid()) as mine,
  coalesce(fl.followers, 0)::int as followers,
  coalesce(fg.following, 0)::int as following,
  coalesce(ps.posts, 0)::int as posts,
  coalesce(cm.comments, 0)::int as comments,
  coalesce(me.followed, false) as followed,
  pf.username
from public.profiles pf
left join lateral (
  select count(*) as followers from public.follows f where f.following_id = pf.id
) fl on true
left join lateral (
  select count(*) as following from public.follows f2 where f2.follower_id = pf.id
) fg on true
left join lateral (
  select count(*) as posts
  from public.posts p
  where p.user_id = pf.id
    and (p.scheduled_at is null or p.scheduled_at <= now())
) ps on true
left join lateral (
  select count(*) as comments from public.post_comments c where c.user_id = pf.id
) cm on true
left join lateral (
  select true as followed from public.follows f3
  where f3.following_id = pf.id and f3.follower_id = auth.uid()
) me on true;

grant select on public.profile_cards to anon, authenticated;

commit;

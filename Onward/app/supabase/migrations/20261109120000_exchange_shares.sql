-- Handing someone a post directly. A share is one row naming the post, the person who
-- handed it on and the person it was handed to. Nothing is copied, so a post keeps one
-- home and deleting it takes every share of it away with it.
--
-- This is the inside-onWard half of the share drawer. Everyone outside onWard is served
-- by the external row in the same drawer, which never touches this table.
--
-- Run after 20261109090000_exchange_titles_reshares.sql: the view below reads
-- posts.title, which that pass adds.
begin;

create table if not exists public.post_shares (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  -- Filled from the token, so a share can only ever be sent in your own name.
  from_user  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_user    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Handing the same post to the same person twice is one share, not two.
  unique (post_id, from_user, to_user)
);

create index if not exists post_shares_to_idx on public.post_shares (to_user, created_at desc);
create index if not exists post_shares_from_idx on public.post_shares (from_user, created_at desc);

alter table public.post_shares enable row level security;

-- Both sides read their own rows - what you were handed, and what you handed on.
-- Nobody else's list of shares is readable by a stranger.
drop policy if exists "shares own read" on public.post_shares;
create policy "shares own read" on public.post_shares for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists "shares own write" on public.post_shares;
create policy "shares own write" on public.post_shares for insert to authenticated
  with check (from_user = auth.uid());

-- Taking a share back is the sender's own row to delete. The other side may already
-- have read it, and the app cannot unsay that, so it does not pretend to.
drop policy if exists "shares sender undo" on public.post_shares;
create policy "shares sender undo" on public.post_shares for delete to authenticated
  using (from_user = auth.uid());

grant select, insert, delete on public.post_shares to authenticated;

-- The reader's two lists in one place: what was handed to them and what they handed on,
-- each row carrying the post itself so a strip needs no second round trip.
--
-- security_barrier because this reads profiles, which RLS keeps to your own row - the
-- view runs as the owner, exactly as feed_posts already does for the authors it names.
create view if not exists public.feed_shares
with (security_barrier = true)
as
select
  s.id,
  s.post_id,
  s.created_at,
  -- False means somebody handed this to you. True means you handed it to somebody.
  (s.from_user = auth.uid()) as mine,
  pf.display_name as from_name,
  coalesce(
    nullif(btrim(upper(pf.initials)), ''),
    upper(left(btrim(pf.display_name), 1))
  ) as from_initials,
  pf.avatar_url as from_avatar_url,
  pt.display_name as to_name,
  jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'body', p.body,
    'full_name', pp.display_name,
    'initials', pp.initials,
    'avatar_url', pp.avatar_url,
    'created_at', p.created_at,
    'media', coalesce(pm.media, '[]'::jsonb)
  ) as post
from public.post_shares s
join public.profiles pf on pf.id = s.from_user
join public.profiles pt on pt.id = s.to_user
join public.posts p on p.id = s.post_id
join public.profiles pp on pp.id = p.user_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', sm.id,
      'kind', sm.kind,
      'path', sm.storage_path,
      'bytes', sm.bytes
    ) order by sm.sort
  ) as media
  from public.post_media sm
  where sm.post_id = p.id
) pm on true;

grant select on public.feed_shares to authenticated;

-- Who is in onWard, for the picker in the share drawer.
--
-- The same names and initials the leaderboard function already hands to any signed-in
-- person, and nothing more: no email, no settings, no onWards. Your own row is left out
-- because you cannot hand a post to yourself.
create or replace function public.search_people(p_query text default '')
returns table (
  id           uuid,
  display_name text,
  initials     text,
  avatar_url   text,
  role         text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    pr.id,
    pr.display_name,
    coalesce(
      nullif(btrim(upper(pr.initials)), ''),
      upper(left(btrim(pr.display_name), 1))
    ) as initials,
    pr.avatar_url,
    pr.role
  from public.profiles pr
  where pr.id <> auth.uid()
    and coalesce(btrim(pr.display_name), '') <> ''
    and (
      coalesce(nullif(btrim(p_query), ''), '') = ''
      -- position() rather than like, so a % typed into the box searches for a percent.
      or position(lower(btrim(p_query)) in lower(pr.display_name)) > 0
    )
  order by pr.display_name
  limit 30;
$$;

revoke all on function public.search_people(text) from public, anon;
grant execute on function public.search_people(text) to authenticated;

commit;

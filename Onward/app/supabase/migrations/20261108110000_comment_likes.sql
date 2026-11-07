-- A comment can be liked. Same contract as post_likes: one row per person per
-- comment, only ever readable by the person who made it, so the only thing a
-- stranger gets is the count taken inside the view - and whether it already
-- carries their own like, which the view answers without naming anybody else.
--
-- Nothing here removes a column. feed_comments gains two, so the build already on
-- Vercel keeps working whether it is deployed before or after this runs.
begin;

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  -- Filled from the token, so a like can only ever be cast in your own name.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_idx on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;

drop policy if exists "comment likes own read" on public.comment_likes;
create policy "comment likes own read" on public.comment_likes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "comment likes own write" on public.comment_likes;
create policy "comment likes own write" on public.comment_likes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "comment likes own delete" on public.comment_likes;
create policy "comment likes own delete" on public.comment_likes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.comment_likes to authenticated;

-- Recreated rather than altered, because a view can only gain columns at the end.
-- The first_name column stays for the same transitional reason it did last pass.
drop view if exists public.feed_comments;

create view public.feed_comments
with (security_barrier = true)
as
select
  c.id,
  c.post_id,
  c.created_at,
  c.body,
  p.display_name as full_name,
  split_part(p.display_name, ' ', 1) as first_name,
  p.initials,
  (c.user_id = auth.uid()) as mine,
  coalesce(l.likes, 0)::int as likes,
  coalesce(k.liked, false) as liked
from public.post_comments c
join public.profiles p on p.id = c.user_id
left join lateral (
  select count(*) as likes
  from public.comment_likes cl
  where cl.comment_id = c.id
) l on true
left join lateral (
  select true as liked
  from public.comment_likes cl2
  where cl2.comment_id = c.id
    and cl2.user_id = auth.uid()
) k on true;

grant select on public.feed_comments to anon, authenticated;

commit;

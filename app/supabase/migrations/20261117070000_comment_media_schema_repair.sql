begin;

alter table public.post_comments
  add column if not exists media jsonb not null default '[]'::jsonb;

alter table public.post_comments
  drop constraint if exists post_comments_body_check;

alter table public.post_comments
  add constraint post_comments_body_check
  check (
    (char_length(body) between 1 and 500)
    or (char_length(body) = 0 and jsonb_array_length(media) > 0)
  );

drop view if exists public.feed_comments;
drop view if exists public.feed_comments_unfiltered;

create view public.feed_comments_unfiltered
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
  coalesce(k.liked, false) as liked,
  c.user_id as author_id,
  c.media
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

revoke all on public.feed_comments_unfiltered from public, anon, authenticated;

create view public.feed_comments
with (security_barrier = true)
as
select c.*
from public.feed_comments_unfiltered c
join public.posts p on p.id = c.post_id
where public.can_read_post_comments(p.id);

grant select on public.feed_comments to anon, authenticated;

notify pgrst, 'reload schema';

commit;

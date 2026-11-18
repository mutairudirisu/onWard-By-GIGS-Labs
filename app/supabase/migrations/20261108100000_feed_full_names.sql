-- The feed shows who wrote a post or a comment by their whole name, the one they gave
-- when they joined, rather than the first word of it. Both views used to publish
-- split_part(display_name, ' ', 1); they now publish display_name itself.
--
-- The surname is therefore readable by anyone who can open the feed, including a
-- stranger who has never signed in. That is a deliberate change to what these two views
-- give away, and the privacy pages say so.
--
-- first_name stays for now: the build already on Vercel selects it, and a view that
-- stopped answering would 400 the deployed feed. The next pass retires it once the
-- client that reads full_name is the one that is deployed.
begin;

drop view if exists public.feed_posts;

create view public.feed_posts
with (security_barrier = true)
as
select
  p.id,
  p.created_at,
  p.body,
  p.ward_id,
  pf.display_name as full_name,
  split_part(pf.display_name, ' ', 1) as first_name,
  pf.initials,
  pf.avatar_url,
  pf.role,
  (p.user_id = auth.uid()) as mine,
  coalesce(m.media, '[]'::jsonb) as media,
  coalesce(l.likes, 0)::int as likes,
  coalesce(c.comments, 0)::int as comments,
  coalesce(r.recent, '[]'::jsonb) as recent_comments
from public.posts p
join public.profiles pf on pf.id = p.user_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', pm.id,
      'kind', pm.kind,
      'path', pm.storage_path,
      'bytes', pm.bytes
    ) order by pm.sort
  ) as media
  from public.post_media pm
  where pm.post_id = p.id
) m on true
left join lateral (
  select count(*) as likes from public.post_likes pl where pl.post_id = p.id
) l on true
left join lateral (
  select count(*) as comments from public.post_comments pc where pc.post_id = p.id
) c on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', x.id,
      'body', x.body,
      'full_name', x.full_name,
      'first_name', x.first_name,
      'initials', x.initials,
      'created_at', x.created_at
    ) order by x.created_at
  ) as recent
  from (
    select pc2.id, pc2.body, pc2.created_at,
           pf2.display_name as full_name,
           split_part(pf2.display_name, ' ', 1) as first_name,
           pf2.initials
    from public.post_comments pc2
    join public.profiles pf2 on pf2.id = pc2.user_id
    where pc2.post_id = p.id
    order by pc2.created_at desc
    limit 2
  ) x
) r on true;

grant select on public.feed_posts to anon, authenticated;

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
  (c.user_id = auth.uid()) as mine
from public.post_comments c
join public.profiles p on p.id = c.user_id;

grant select on public.feed_comments to anon, authenticated;

commit;

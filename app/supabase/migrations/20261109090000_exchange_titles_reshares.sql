-- The surface is called Exchange now: an entry carries a headline as well as what
-- it says, and a person can pass someone else's entry into their own stream.
--
-- title is not null with a default of '', so every post that already exists keeps
-- answering and simply has no headline. reshare_of is the repost: a row of the
-- reshaper's own that points at the post being passed on, so deleting the reshare
-- is only ever deleting your own.
--
-- on delete cascade on reshare_of means a reshare goes when the post it carries
-- goes. That is the repost contract - a reshare with nothing inside it is a card
-- nobody can open - and it is why the original author's delete reaches other
-- people's rows here and nowhere else.
--
-- Every column the deployed build already selects keeps its name and position; the
-- four new ones are appended, so the feed answers whether this runs before or after
-- the next deploy. first_name stays for that same transitional reason.
begin;

alter table public.posts
  add column if not exists title text not null default ''
    check (char_length(title) <= 140);

alter table public.posts
  add column if not exists reshare_of uuid
    references public.posts (id) on delete cascade;

create index if not exists posts_reshare_idx on public.posts (reshare_of);

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
  coalesce(r.recent, '[]'::jsonb) as recent_comments,
  p.title,
  p.reshare_of,
  coalesce(rs.reshares, 0)::int as reshares,
  -- Has the reader already passed this one on? Their own row answers it, and the
  -- answer is only ever about them.
  coalesce(mine_r.reshared, false) as reshared,
  o.reshare
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
) r on true
left join lateral (
  select count(*) as reshares from public.posts pr where pr.reshare_of = p.id
) rs on true
left join lateral (
  select true as reshared
  from public.posts pr2
  where pr2.reshare_of = p.id
    and pr2.user_id = auth.uid()
) mine_r on true
-- The entry being passed on, with its own author's name and files, and nothing
-- deeper: a reshare of a reshare is not offered in the app.
left join lateral (
  select jsonb_build_object(
    'id', po.id,
    'title', po.title,
    'body', po.body,
    'full_name', pfo.display_name,
    'initials', pfo.initials,
    'avatar_url', pfo.avatar_url,
    'created_at', po.created_at,
    'media', coalesce(pom.media, '[]'::jsonb)
  ) as reshare
  from public.posts po
  join public.profiles pfo on pfo.id = po.user_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', pm2.id,
        'kind', pm2.kind,
        'path', pm2.storage_path,
        'bytes', pm2.bytes
      ) order by pm2.sort
    ) as media
    from public.post_media pm2
    where pm2.post_id = po.id
  ) pom on true
  where po.id = p.reshare_of
) o on true;

grant select on public.feed_posts to anon, authenticated;

commit;

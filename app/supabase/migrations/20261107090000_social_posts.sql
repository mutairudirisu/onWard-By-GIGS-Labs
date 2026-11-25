-- The feed becomes its own thing: posts people write for the feed, with images and
-- video, likes, comments and a share link. onWard entries stop being feed items, so
-- the published flag and the applause table that made them one go away in the same
-- pass.
begin;

-- -------------------------------------------------------------------- posts
-- The text a person chose to publish. ward_id is provenance only: it says which win
-- the composer was opened from, and the entry itself stays private.
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  -- Filled from the token, so nobody can write a post in someone else's name.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ward_id    uuid references public.on_wards (id) on delete set null,
  body       text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_user_idx on public.posts (user_id);

-- ---------------------------------------------------------------- post media
-- One row per file, in the order the author picked them. The bytes live in the
-- post-media bucket; this table only holds the path they were uploaded to.
create table if not exists public.post_media (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('image', 'video')),
  -- {userId}/{postId}/{n}.{ext}, which is what the storage policies below key on.
  storage_path text not null unique,
  bytes        bigint,
  sort         smallint not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists post_media_post_idx on public.post_media (post_id, sort);

-- ----------------------------------------------------------------- comments
-- Attributed by design: a comment shows the same first name and initials the post
-- itself shows, and nothing more.
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

-- --------------------------------------------------------------------- likes
-- Same shape as the applause table it replaces: one row per person per post, so a
-- double tap is impossible and the count is a plain count.
create table if not exists public.post_likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id);

-- ----------------------------------------------------------------------- RLS
alter table public.posts        enable row level security;
alter table public.post_media   enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes   enable row level security;

-- Reading the tables directly is only ever about your own rows: the app writes
-- there, and everything it shows other people comes from the views below. That
-- keeps user_id and ward_id out of what a stranger can pull, even though the
-- posts themselves are public.
drop policy if exists "posts own read" on public.posts;
create policy "posts own read" on public.posts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "posts owner delete" on public.posts;
create policy "posts owner delete" on public.posts for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "media own read" on public.post_media;
create policy "media own read" on public.post_media for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "media owner write" on public.post_media;
create policy "media owner write" on public.post_media for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "media owner delete" on public.post_media;
create policy "media owner delete" on public.post_media for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "comments own read" on public.post_comments;
create policy "comments own read" on public.post_comments for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "comments owner write" on public.post_comments;
create policy "comments owner write" on public.post_comments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "comments owner delete" on public.post_comments;
create policy "comments owner delete" on public.post_comments for delete to authenticated
  using (user_id = auth.uid());

-- Your own likes, and nothing else's. Unlike the other three, this one stays private:
-- the number a stranger sees comes from the view, never from these rows.
drop policy if exists "likes own read" on public.post_likes;
create policy "likes own read" on public.post_likes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "likes own write" on public.post_likes;
create policy "likes own write" on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "likes own delete" on public.post_likes;
create policy "likes own delete" on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

-- Nobody gets the tables as such: select here is what lets an insert hand its new
-- id back, and RLS keeps that answer to the rows the writer owns.
grant select, insert, delete on public.posts, public.post_media, public.post_comments to authenticated;
grant select, insert, delete on public.post_likes to authenticated;

-- -------------------------------------------------------------------- storage
-- The first bucket this project has. Public read is what lets an <img> tag work
-- without a token; the caps are the moderation that exists until there is a person
-- doing moderation.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-media', 'post-media', true, 26214400,
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
         'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post media public read" on storage.objects;
create policy "post media public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'post-media');

-- Files live under a folder named after the uploader, so an author can only ever
-- touch their own.
drop policy if exists "post media owner insert" on storage.objects;
create policy "post media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = coalesce(auth.uid()::text, ''));

drop policy if exists "post media owner delete" on storage.objects;
create policy "post media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = coalesce(auth.uid()::text, ''));

-- Deleting a post has to take its files with it, because a row nobody can reach is not
-- the promise the privacy page makes. That happens in the app, through the Storage API:
-- Supabase's own protect_delete() trigger rejects any direct delete on storage.objects,
-- so a database-side purge cannot be written here at all. The owner-only delete policy
-- above is what lets a person's own files go through that API.

-- ---------------------------------------------------------------------- view
-- Replaces the onWard read entirely, so the old shape goes first: the new one shares
-- no column order with it.
drop view if exists public.feed_posts;

create view public.feed_posts
with (security_barrier = true)
as
select
  p.id,
  p.created_at,
  p.body,
  p.ward_id,
  split_part(pf.display_name, ' ', 1) as first_name,
  pf.initials,
  pf.avatar_url,
  pf.role,
  -- Whose post this is, told only to the person looking at their own. The id itself
  -- stays inside the view, so a stranger learns nothing they did not already see.
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
-- Two, oldest first: enough to show a thread exists without pushing the next post
-- off the screen.
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', x.id,
      'body', x.body,
      'first_name', x.first_name,
      'initials', x.initials,
      'created_at', x.created_at
    ) order by x.created_at
  ) as recent
  from (
    select pc2.id, pc2.body, pc2.created_at,
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

-- The whole thread, for the page a share link opens. A comment is only ever shown
-- with the same two things a post is, plus whether the reader wrote it.
create view public.feed_comments
with (security_barrier = true)
as
select
  c.id,
  c.post_id,
  c.created_at,
  c.body,
  split_part(p.display_name, ' ', 1) as first_name,
  p.initials,
  (c.user_id = auth.uid()) as mine
from public.post_comments c
join public.profiles p on p.id = c.user_id;

grant select on public.feed_comments to anon, authenticated;

-- ------------------------------------------------------------- what is leaving
-- Both were introduced days ago for the onWard-as-post feed and nothing else reads
-- them. The applause rows do not carry over: they point at onWard ids, and post_likes
-- points at posts, so the one reaction made so far ends with this migration. The
-- entry it was on stops being a feed item the moment the flag goes.
drop table if exists public.feed_applause;
drop index if exists public.on_wards_published_day_idx;
alter table public.on_wards drop column if exists published;

commit;

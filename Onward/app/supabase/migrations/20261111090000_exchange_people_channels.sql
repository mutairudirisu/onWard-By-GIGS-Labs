-- People and rooms in the Exchange: who follows whom, and channels anybody can join.
--
-- A follow is one row and nothing else - no feed of its own, no notification. It is
-- how a profile knows its numbers and how the Exchange can later put the people you
-- follow first. Following yourself is refused by the table, not by the app.
--
-- A channel is a room with a name, an owner and a member list. Posts keep one home:
-- a channel post is a row of posts with a channel_id, so it shows in the channel and
-- in the Exchange the same way, and deleting it is the delete that already exists.
-- Joining is a row of channel_members, which is what "member" means and nothing more.
--
-- The feed view is recreated to carry the author's id and the channel a post belongs
-- to, and the reshare it carries now names its own author and includes its poll. Every
-- column the deployed build selects keeps its name and position and the new ones are
-- appended, so the Exchange answers whether this runs before or after the next deploy.
--
-- Run after 20261109150000_exchange_polls.sql: the reshare below reads the poll tables
-- that pass creates.
begin;

-- --------------------------------------------------------------------- follows
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Both directions are asked for on their own: who follows this person, and who does
-- this person follow.
create index if not exists follows_following_idx on public.follows (following_id, created_at desc);
create index if not exists follows_follower_idx on public.follows (follower_id, created_at desc);

alter table public.follows enable row level security;

-- Who follows whom is public, the same way a post is: the Exchange is a public room
-- and these numbers are on the profile card anybody can open.
drop policy if exists "follows: everyone reads" on public.follows;
create policy "follows: everyone reads" on public.follows
  for select to anon, authenticated using (true);

-- A follow is only ever written in your own name, and taken back by you.
drop policy if exists "follows: own write" on public.follows;
create policy "follows: own write" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists "follows: own undo" on public.follows;
create policy "follows: own undo" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

-- -------------------------------------------------------------------- channels
create table if not exists public.channels (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 2 and 40),
  about      text not null default '' check (char_length(about) <= 280),
  created_at timestamptz not null default now()
);

-- Two rooms called Design are one room too many to find, so the name is the key.
-- Compared folded and trimmed, which is what a person typing it means.
create unique index if not exists channels_name_key on public.channels (lower(btrim(name)));
create index if not exists channels_owner_idx on public.channels (owner_id);

create table if not exists public.channel_members (
  channel_id uuid not null references public.channels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index if not exists channel_members_user_idx on public.channel_members (user_id, joined_at desc);

alter table public.posts
  add column if not exists channel_id uuid references public.channels (id) on delete cascade;

create index if not exists posts_channel_idx on public.posts (channel_id, created_at desc);

alter table public.channels enable row level security;
alter table public.channel_members enable row level security;

drop policy if exists "channels: everyone reads" on public.channels;
create policy "channels: everyone reads" on public.channels
  for select to anon, authenticated using (true);

drop policy if exists "channels: own room" on public.channels;
create policy "channels: own room" on public.channels
  for insert to authenticated with check (owner_id = auth.uid());

-- Renaming or re-writing a room is the owner's, and so is closing it.
drop policy if exists "channels: owner edits" on public.channels;
create policy "channels: owner edits" on public.channels
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "channels: owner closes" on public.channels;
create policy "channels: owner closes" on public.channels
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "members: everyone reads" on public.channel_members;
create policy "members: everyone reads" on public.channel_members
  for select to anon, authenticated using (true);

drop policy if exists "members: join as yourself" on public.channel_members;
create policy "members: join as yourself" on public.channel_members
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "members: leave as yourself" on public.channel_members;
create policy "members: leave as yourself" on public.channel_members
  for delete to authenticated using (user_id = auth.uid());

grant select on public.channels, public.channel_members to anon, authenticated;
grant insert, update, delete on public.channels to authenticated;
grant insert, delete on public.channel_members to authenticated;

-- Opening a room puts you in it. Without this the owner would have to join their own
-- channel before they could post in it, and a channel with no members reads as broken.
create or replace function public.channel_owner_joins()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into public.channel_members (channel_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists channels_owner_joins on public.channels;
create trigger channels_owner_joins
  after insert on public.channels
  for each row execute function public.channel_owner_joins();

-- ------------------------------------------------------------------ the feed view
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
  o.reshare,
  -- Whose entry this is, so a card can lead to a profile.
  p.user_id as author_id,
  p.channel_id,
  ch.name as channel_name
from public.posts p
join public.profiles pf on pf.id = p.user_id
left join public.channels ch on ch.id = p.channel_id
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
-- The entry being passed on, with its own author's name, files and poll, and nothing
-- deeper: a reshare of a reshare is not offered in the app.
left join lateral (
  select jsonb_build_object(
    'id', po.id,
    'title', po.title,
    'body', po.body,
    'full_name', pfo.display_name,
    'initials', pfo.initials,
    'avatar_url', pfo.avatar_url,
    'user_id', po.user_id,
    'created_at', po.created_at,
    'media', coalesce(pom.media, '[]'::jsonb),
    'poll', ppoll.poll
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
  -- Carried for reading, not for voting: the counts travel with the card so a repost
  -- of a poll shows the question instead of an empty box.
  left join lateral (
    select jsonb_build_object(
      'id', pp.id,
      'question', pp.question,
      'ends_at', pp.ends_at,
      'closed', pp.ends_at <= now(),
      'total', coalesce(pt.total, 0),
      'options', coalesce(po2.options, '[]'::jsonb)
    ) as poll
    from public.post_polls pp
    left join lateral (
      select count(*) as total from public.post_poll_votes pv where pv.poll_id = pp.id
    ) pt on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'id', opt.id,
          'label', opt.label,
          'sort', opt.sort,
          'votes', coalesce(cn.n, 0)
        ) order by opt.sort
      ) as options
      from public.post_poll_options opt
      left join (
        select option_id, count(*) as n from public.post_poll_votes group by option_id
      ) cn on cn.option_id = opt.id
      where opt.poll_id = pp.id
    ) po2 on true
    where pp.post_id = po.id
  ) ppoll on true
  where po.id = p.reshare_of
) o on true;

grant select on public.feed_posts to anon, authenticated;

-- --------------------------------------------------------------- profile cards
-- One row per person, holding everything a profile header shows. No email, no plan,
-- no onWards: the same line the Exchange already draws around a post.
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
  -- Has the reader followed this person? Their own row answers it.
  coalesce(me.followed, false) as followed
from public.profiles pf
left join lateral (
  select count(*) as followers from public.follows f where f.following_id = pf.id
) fl on true
left join lateral (
  select count(*) as following from public.follows f2 where f2.follower_id = pf.id
) fg on true
left join lateral (
  select count(*) as posts from public.posts p where p.user_id = pf.id
) ps on true
left join lateral (
  select count(*) as comments from public.post_comments c where c.user_id = pf.id
) cm on true
left join lateral (
  select true as followed from public.follows f3
  where f3.following_id = pf.id and f3.follower_id = auth.uid()
) me on true;

grant select on public.profile_cards to anon, authenticated;

-- ----------------------------------------------------------- a person's replies
-- The Comments tab: what this person said, and on which entry, newest first.
create or replace view public.profile_comments
with (security_barrier = true)
as
select
  c.id,
  c.post_id,
  c.user_id as author_id,
  c.body,
  c.created_at,
  (c.user_id = auth.uid()) as mine,
  p.title as post_title,
  p.body as post_body,
  pa.display_name as post_author
from public.post_comments c
join public.posts p on p.id = c.post_id
join public.profiles pa on pa.id = p.user_id;

grant select on public.profile_comments to anon, authenticated;

-- --------------------------------------------------------------- channel cards
create or replace view public.channel_cards
with (security_barrier = true)
as
select
  ch.id,
  ch.name,
  ch.about,
  ch.owner_id,
  ch.created_at,
  ow.display_name as owner_name,
  ow.avatar_url as owner_avatar_url,
  coalesce(
    nullif(btrim(upper(ow.initials)), ''),
    upper(left(btrim(ow.display_name), 1))
  ) as owner_initials,
  (ch.owner_id = auth.uid()) as mine,
  coalesce(mb.members, 0)::int as members,
  coalesce(ps.posts, 0)::int as posts,
  coalesce(jn.joined, false) as joined
from public.channels ch
join public.profiles ow on ow.id = ch.owner_id
left join lateral (
  select count(*) as members from public.channel_members m where m.channel_id = ch.id
) mb on true
left join lateral (
  select count(*) as posts from public.posts p where p.channel_id = ch.id
) ps on true
left join lateral (
  select true as joined from public.channel_members m2
  where m2.channel_id = ch.id and m2.user_id = auth.uid()
) jn on true;

grant select on public.channel_cards to anon, authenticated;

-- ------------------------------------------------------------- follow lists
-- Who follows a person, or who they follow. One function, because the two lists are
-- the same shape and the profile shows them from the same drawer.
create or replace function public.follow_list(p_person uuid, p_kind text default 'followers')
returns table (
  id         uuid,
  full_name  text,
  initials   text,
  avatar_url text,
  role       text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    pr.id,
    pr.display_name as full_name,
    coalesce(
      nullif(btrim(upper(pr.initials)), ''),
      upper(left(btrim(pr.display_name), 1))
    ) as initials,
    pr.avatar_url,
    pr.role,
    f.created_at
  from public.follows f
  join public.profiles pr
    on pr.id = case when p_kind = 'following' then f.following_id else f.follower_id end
  where case when p_kind = 'following' then f.follower_id else f.following_id end = p_person
    and coalesce(btrim(pr.display_name), '') <> ''
  order by f.created_at desc
  limit 200;
$$;

revoke all on function public.follow_list(uuid, text) from public;
grant execute on function public.follow_list(uuid, text) to anon, authenticated;

-- --------------------------------------------------------------------- search
-- The Exchange search box: people, channels and entries in one answer, so the sheet
-- needs one round trip and nothing is searched that a stranger may not already read.
create or replace function public.search_exchange(p_query text default '')
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with q as (
    select lower(btrim(coalesce(p_query, ''))) as term
  )
  select jsonb_build_object(
    'people', (
      select coalesce(jsonb_agg(x.entry), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', pr.id,
          'full_name', pr.display_name,
          'initials', coalesce(
            nullif(btrim(upper(pr.initials)), ''),
            upper(left(btrim(pr.display_name), 1))
          ),
          'avatar_url', pr.avatar_url,
          'role', pr.role
        ) as entry
        from public.profiles pr, q
        where coalesce(btrim(pr.display_name), '') <> ''
          -- position() rather than like, so a % typed into the box searches for a percent.
          and (q.term = '' or position(q.term in lower(pr.display_name)) > 0
               or position(q.term in lower(coalesce(pr.role, ''))) > 0)
        order by (q.term <> '' and position(q.term in lower(pr.display_name)) = 1) desc,
                 pr.display_name
        limit 6
      ) x
    ),
    'channels', (
      select coalesce(jsonb_agg(x.entry), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', ch.id,
          'name', ch.name,
          'about', ch.about,
          'owner_name', ow.display_name,
          'members', (select count(*) from public.channel_members m where m.channel_id = ch.id)
        ) as entry
        from public.channels ch
        join public.profiles ow on ow.id = ch.owner_id, q
        where q.term = ''
           or position(q.term in lower(ch.name)) > 0
           or position(q.term in lower(ch.about)) > 0
        order by (q.term <> '' and position(q.term in lower(ch.name)) = 1) desc, ch.name
        limit 5
      ) x
    ),
    'posts', (
      select coalesce(jsonb_agg(x.entry), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'body', left(p.body, 160),
          'full_name', pa.display_name,
          'initials', coalesce(
            nullif(btrim(upper(pa.initials)), ''),
            upper(left(btrim(pa.display_name), 1))
          ),
          'avatar_url', pa.avatar_url,
          'created_at', p.created_at
        ) as entry
        from public.posts p
        join public.profiles pa on pa.id = p.user_id, q
        where (p.title <> '' or p.body <> '')
          and (q.term = ''
               or position(q.term in lower(p.title)) > 0
               or position(q.term in lower(p.body)) > 0)
        order by (q.term <> '' and position(q.term in lower(p.title)) > 0) desc,
                 p.created_at desc
        limit 8
      ) x
    )
  );
$$;

revoke all on function public.search_exchange(text) from public;
grant execute on function public.search_exchange(text) to anon, authenticated;

commit;

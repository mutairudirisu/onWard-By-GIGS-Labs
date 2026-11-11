-- onWard: the six migration passes the live project is still missing.
--
-- Exchange audience settings are a separate migration. Apply all earlier Exchange
-- migrations in timestamp order through 20261111100000_post_document_uploads.sql
-- before applying 20261111120000_post_audience_settings.sql. In particular, the
-- latter depends on 20261111090000_exchange_people_channels.sql and the document
-- upload schema.
-- After that migration, apply 20261111150000_remove_exchange_channels.sql to disable
-- channel access. It preserves existing channel rows; legacy channel-only posts become
-- visible only to their authors.
--
-- Why this file exists: the app deployed on Vercel already reads and writes columns,
-- tables and values that the Supabase project has never been given, which is exactly
-- what "Could not find the 'title' column of 'posts' in the schema cache" and
-- "Could not find the table 'public.feedback'" mean. Nothing in the code is wrong;
-- the schema is behind it.
--
-- How to run it: open https://supabase.com/dashboard/project/lakpaqruemdjyvwprfme/sql/new,
-- paste this whole file, press Run. Each pass is its own begin;/commit;, so a pass
-- that fails leaves everything before it applied and nothing after it attempted.
-- Order matters only here: pass 3 reads posts.title, which pass 2 adds.
--
-- Nothing in here deletes a column or a table, and no existing row is rewritten.
-- Every pass is safe to run twice except pass 4, whose policies are created plainly -
-- if it says "policy already exists", that pass has already been applied and you can
-- cut the script off before it and run only the passes after it.



-- ====================================================================
-- PASS 1 :: 20261108110000_comment_likes.sql
-- ====================================================================
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


-- ====================================================================
-- PASS 2 :: 20261109090000_exchange_titles_reshares.sql
-- ====================================================================
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


-- ====================================================================
-- PASS 3 :: 20261109120000_exchange_shares.sql
-- ====================================================================
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
create or replace view public.feed_shares
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


-- ====================================================================
-- PASS 4 :: 20261109150000_exchange_polls.sql
-- ====================================================================
-- A poll an Exchange post carries: a question, two to six answers, and a time it stops
-- taking votes.
--
-- It lives in its own tables and its own view rather than as columns on posts, so the
-- feed keeps answering whether or not this has run yet: an app that has not been told
-- about polls simply does not find any for a post, and shows the post on its own.
--
-- One vote per person per poll is the primary key on the votes table, not a rule the
-- app has to remember. Changing your mind is an update of that row, and both the
-- change and the first cast go through vote_in_poll, which is the only place the
-- closing time is checked. A client-side countdown would let a stale tab vote after
-- the poll closed; this does not.
begin;

-- ---------------------------------------------------------------------- polls
create table if not exists public.post_polls (
  id         uuid primary key default gen_random_uuid(),
  -- One poll per post, and it goes when the post goes.
  post_id    uuid not null unique references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question   text not null check (char_length(question) between 1 and 200),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  -- A poll that closed before it opened is not a poll.
  check (ends_at > created_at)
);

create index if not exists post_polls_ends_idx on public.post_polls (ends_at);

-- --------------------------------------------------------------------- options
create table if not exists public.post_poll_options (
  id      uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.post_polls (id) on delete cascade,
  label   text not null check (char_length(label) between 1 and 120),
  sort    smallint not null,
  unique (poll_id, sort),
  -- The label is what a reader sees twice, so the same answer cannot be offered twice.
  unique (poll_id, label),
  -- (id, poll_id) is what a vote's foreign key points at: it is what makes an option
  -- belonging to another poll impossible to vote for.
  unique (id, poll_id)
);

-- ----------------------------------------------------------------------- votes
create table if not exists public.post_poll_votes (
  poll_id    uuid not null references public.post_polls (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  option_id  uuid not null,
  created_at timestamptz not null default now(),
  -- One person, one answer, for as long as the poll is open.
  primary key (poll_id, user_id),
  foreign key (option_id, poll_id) references public.post_poll_options (id, poll_id) on delete cascade
);

create index if not exists post_poll_votes_option_idx on public.post_poll_votes (option_id);
create index if not exists post_poll_votes_user_idx on public.post_poll_votes (user_id);

-- ----------------------------------------------------------------------- RLS
alter table public.post_polls        enable row level security;
alter table public.post_poll_options enable row level security;
alter table public.post_poll_votes   enable row level security;

-- Reading a table directly is only ever about your own rows, same as every other
-- social table here: results and other people's votes come through the view below.
-- Nothing is written through a policy at all - both writes are definer functions, so
-- the closing time is part of the write and not something a client can skip.
drop policy if exists "polls: own rows" on public.post_polls;
create policy "polls: own rows" on public.post_polls
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "votes: own rows" on public.post_poll_votes;
create policy "votes: own rows" on public.post_poll_votes
  for select to authenticated using (user_id = auth.uid());

grant select on public.post_polls to authenticated;
grant select on public.post_poll_votes to authenticated;

-- ------------------------------------------------------------------ make a poll
-- Called with the post that was just written. The author check, the option count and
-- the window the poll may stay open are all answered here rather than in the app.
create or replace function public.create_poll(
  p_post_id  uuid,
  p_question text,
  p_options  text[],
  p_ends_at  timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_id    uuid;
  v_label text;
  v_sort  int := 0;
begin
  if auth.uid() is null then
    raise exception 'sign in to run a poll' using errcode = '42501';
  end if;

  select user_id into v_owner from public.posts where id = p_post_id;
  if v_owner is null then
    raise exception 'no such post' using errcode = 'P0002';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'only the author can add a poll' using errcode = '42501';
  end if;

  if btrim(coalesce(p_question, '')) = '' then
    raise exception 'a poll needs a question' using errcode = '22023';
  end if;
  if p_options is null or array_length(p_options, 1) not in (2, 3, 4, 5, 6) then
    raise exception 'a poll needs two to six answers' using errcode = '22023';
  end if;
  -- Long enough to be worth answering, short enough that a poll cannot be left open
  -- by accident for a year.
  if p_ends_at is null or p_ends_at <= now() + interval '10 minutes' or p_ends_at > now() + interval '30 days' then
    raise exception 'a poll has to stay open between ten minutes and thirty days' using errcode = '22023';
  end if;

  insert into public.post_polls (post_id, user_id, question, ends_at)
  values (p_post_id, auth.uid(), btrim(p_question), p_ends_at)
  returning id into v_id;

  foreach v_label in array p_options loop
    v_sort := v_sort + 1;
    if btrim(v_label) = '' then
      raise exception 'an answer cannot be empty' using errcode = '22023';
    end if;
    insert into public.post_poll_options (poll_id, label, sort)
    values (v_id, btrim(v_label), v_sort::smallint);
  end loop;

  return v_id;
end;
$$;

revoke all on function public.create_poll(uuid, text, text[], timestamptz) from public, anon;
grant execute on function public.create_poll(uuid, text, text[], timestamptz) to authenticated;

-- --------------------------------------------------------------------- cast one
create or replace function public.vote_in_poll(p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_poll  uuid;
  v_close timestamptz;
begin
  if auth.uid() is null then
    raise exception 'sign in to vote' using errcode = '42501';
  end if;

  -- The option and its poll's closing time in one read; a missing option answers null.
  select o.poll_id, p.ends_at into v_poll, v_close
    from public.post_poll_options o
    join public.post_polls p on p.id = o.poll_id
   where o.id = p_option_id;

  if v_poll is null then
    raise exception 'no such answer' using errcode = 'P0002';
  end if;
  if v_close <= now() then
    raise exception 'this poll has closed' using errcode = '22023';
  end if;

  insert into public.post_poll_votes (poll_id, option_id, user_id)
  values (v_poll, p_option_id, auth.uid())
  on conflict (poll_id, user_id)
  do update set option_id = excluded.option_id, created_at = now();
end;
$$;

revoke all on function public.vote_in_poll(uuid) from public, anon;
grant execute on function public.vote_in_poll(uuid) to authenticated;

-- -------------------------------------------------------------------- the view
-- What every reader sees: the question, the answers with their counts, whether it is
-- still open, and which answer is yours.
create or replace view public.feed_polls
with (security_barrier = true)
as
select
  p.id,
  p.post_id,
  p.question,
  p.ends_at,
  (p.ends_at <= now()) as closed,
  coalesce(o.options, '[]'::jsonb) as options,
  coalesce(t.total, 0)::int as total,
  mine.option_id as my_option_id
from public.post_polls p
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', opt.id,
      'label', opt.label,
      'sort', opt.sort,
      'votes', coalesce(cnt.n, 0)
    ) order by opt.sort
  ) as options
  from public.post_poll_options opt
  left join (
    select option_id, count(*) as n from public.post_poll_votes group by option_id
  ) cnt on cnt.option_id = opt.id
  where opt.poll_id = p.id
) o on true
left join lateral (
  select count(*) as total from public.post_poll_votes v where v.poll_id = p.id
) t on true
-- The reader's own vote, which is the only thing here that is about them and not
-- about the poll.
left join public.post_poll_votes mine
  on mine.poll_id = p.id and mine.user_id = auth.uid();

grant select on public.feed_polls to anon, authenticated;

commit;


-- ====================================================================
-- PASS 5 :: 20261110090000_in_app_feedback.sql
-- ====================================================================
-- What people say about the app, kept for the people who run it.
--
-- The question is the two-tap one - "How is onWard so far?" - so the answer is stored
-- as the tap itself and the words are optional. A rating with no words still counts;
-- words with no rating never happen, because the card cannot be sent before a tap.
--
-- screen says where the question was asked, so "not really" from someone who has only
-- just arrived reads differently from "not really" from someone who came back after a
-- month away. It is free text rather than an enum: a new place to ask should not need
-- a migration.
--
-- There is no update and no delete policy. Feedback is a statement, not a record
-- someone keeps editing, and a row that can be withdrawn is a row that quietly
-- disappears from the count the admin sees.
begin;

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  -- Filled from the token, so nobody can put words in someone else's mouth.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  answer     text not null check (answer in ('love_it', 'not_really')),
  body       text not null default '' check (char_length(body) <= 1000),
  screen     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback own read" on public.feedback;
create policy "feedback own read" on public.feedback for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "feedback own write" on public.feedback;
create policy "feedback own write" on public.feedback for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.feedback to authenticated;

-- --------------------------------------------------------------- the admin console
-- One call for the whole list, newest first, with whoever said it attached. Reading
-- other people's rows is only ever possible through here, and only for someone with a
-- row in public.admins - the same gate every other admin call uses.
create or replace function public.admin_feedback()
returns table (
  id         uuid,
  created_at timestamptz,
  answer     text,
  body       text,
  screen     text,
  display_name text,
  email      text,
  role       text,
  plan       text
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not internal.is_admin() then
    raise exception 'not authorised';
  end if;

  return query
  select
    f.id,
    f.created_at,
    f.answer,
    f.body,
    f.screen,
    p.display_name,
    u.email,
    p.role,
    p.plan
  from public.feedback f
  left join public.profiles p on p.id = f.user_id
  left join auth.users u on u.id = f.user_id
  order by f.created_at desc;
end;
$$;

revoke all on function public.admin_feedback() from public, anon;
grant execute on function public.admin_feedback() to authenticated;

commit;


-- ====================================================================
-- PASS 6 :: 20261110120000_system_theme.sql
-- ====================================================================
-- Theme gains a third answer: follow whatever the device is doing.
--
-- The app now sends 'system', and the check constraint left over from the first schema
-- pass only ever allowed the two manual choices, so the preference would be rejected by
-- the database rather than by the app.
--
-- The old constraint is found by what it mentions instead of by name. A guarded drop of
-- one guessed name would quietly do nothing if the name were different, and the pass
-- would then add a second constraint while the first went on refusing 'system'.
--
-- No row changes: every account already stored is light or dark, and both still satisfy
-- the new rule.
begin;

do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.user_settings'::regclass
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%theme%'
  loop
    execute format('alter table public.user_settings drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.user_settings
  add constraint user_settings_theme_check
  check (theme in ('light', 'dark', 'system'));

commit;


-- ============================================================================
-- AFTER THE RUN
--
-- One row, eight answers, every one of them "present". Run this on its own once
-- the script above has finished, then reload myonward.vercel.app.
-- ============================================================================
select
  case when exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'posts' and column_name = 'title'
  ) then 'present' else 'MISSING' end as posts_title,
  case when exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'posts' and column_name = 'reshare_of'
  ) then 'present' else 'MISSING' end as posts_reshare_of,
  case when exists (select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'comment_likes')
  then 'present' else 'MISSING' end as comment_likes,
  case when exists (select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'post_shares')
  then 'present' else 'MISSING' end as post_shares,
  case when exists (select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'post_polls')
  then 'present' else 'MISSING' end as post_polls,
  case when exists (select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'feedback')
  then 'present' else 'MISSING' end as feedback,
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'admin_feedback')
  then 'present' else 'MISSING' end as admin_feedback_fn,
  -- The theme rule, read back from the constraint itself rather than by its name.
  case when exists (
    select 1 from pg_constraint con
     where con.conrelid = 'public.user_settings'::regclass
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%system%'
  ) then 'present' else 'MISSING' end as theme_allows_system;

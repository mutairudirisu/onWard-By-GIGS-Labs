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

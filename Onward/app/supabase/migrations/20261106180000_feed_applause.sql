-- The feed card shows what skills a win was built from and how many people applauded
-- it, so this adds the reaction table and gives the view the two extra columns.
begin;

-- Deliberately anonymous: the table holds one row per person per post, and the only
-- thing anyone else can read out of it is a count taken through the view. A reaction
-- can never be traced back to a name, which is what makes it safe to show at all.
create table if not exists public.feed_applause (
  ward_id    uuid not null references public.on_wards (id) on delete cascade,
  -- Filled from the token, so a client cannot file a reaction in someone else's name.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ward_id, user_id)
);

create index if not exists feed_applause_user_idx on public.feed_applause (user_id);

alter table public.feed_applause enable row level security;

-- Read your own rows only: that is how the app knows to draw your tap as filled, and
-- it is also why nobody can list who applauded what.
drop policy if exists "applause own read" on public.feed_applause;
create policy "applause own read"
  on public.feed_applause for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "applause own write" on public.feed_applause;
create policy "applause own write"
  on public.feed_applause for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "applause own delete" on public.feed_applause;
create policy "applause own delete"
  on public.feed_applause for delete to authenticated
  using (user_id = auth.uid());

-- Stated rather than left to the project's default privileges: a signed-in reader
-- may file and withdraw their own reactions, and an anonymous one may not touch the
-- table at all. The count a visitor sees comes through the view, not from here.
grant select, insert, delete on public.feed_applause to authenticated;
revoke all on public.feed_applause from anon;

-- Existing columns keep their order and only two are appended, which is the one shape
-- CREATE OR REPLACE VIEW accepts. A view runs as its owner, so the aggregates below
-- reach other people's rows without granting anything on the tables behind them.
create or replace view public.feed_posts
with (security_barrier = true)
as
select
  w.id,
  w.day,
  w.created_at,
  w.title,
  w.impact,
  left(w.body, 400) as detail,
  split_part(p.display_name, ' ', 1) as first_name,
  p.initials,
  coalesce(
    (
      select array_agg(s.name order by s.name)
      from public.ward_skills ws
      join public.skills s on s.id = ws.skill_id
      where ws.ward_id = w.id
    ),
    '{}'
  ) as skills,
  (select count(*) from public.feed_applause a where a.ward_id = w.id)::int as applause
from public.on_wards w
join public.profiles p on p.id = w.user_id
where w.published;

grant select on public.feed_posts to anon, authenticated;

commit;

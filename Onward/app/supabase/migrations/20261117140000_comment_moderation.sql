begin;

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_id, blocker_id);

alter table public.user_blocks enable row level security;

drop policy if exists "user blocks read by participants" on public.user_blocks;
drop policy if exists "user blocks own read" on public.user_blocks;
create policy "user blocks own read" on public.user_blocks
  for select to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "user blocks own write" on public.user_blocks;
create policy "user blocks own write" on public.user_blocks
  for insert to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "user blocks own delete" on public.user_blocks;
create policy "user blocks own delete" on public.user_blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

grant select, delete on public.user_blocks to authenticated;
revoke insert on public.user_blocks from authenticated;
revoke all on public.user_blocks from anon, public;

create or replace function public.block_person(p_person uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_person = auth.uid() then
    raise exception 'You cannot block yourself' using errcode = '22023';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (auth.uid(), p_person)
  on conflict do nothing;

  delete from public.follows
  where (follower_id = auth.uid() and following_id = p_person)
     or (follower_id = p_person and following_id = auth.uid());
end;
$$;

revoke all on function public.block_person(uuid) from public, anon;
grant execute on function public.block_person(uuid) to authenticated;

create table if not exists public.dismissed_comments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table public.dismissed_comments enable row level security;

drop policy if exists "dismissed comments own read" on public.dismissed_comments;
create policy "dismissed comments own read" on public.dismissed_comments
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "dismissed comments own write" on public.dismissed_comments;
create policy "dismissed comments own write" on public.dismissed_comments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.feed_comments c
      where c.id = comment_id
    )
  );

drop policy if exists "dismissed comments own delete" on public.dismissed_comments;
create policy "dismissed comments own delete" on public.dismissed_comments
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.dismissed_comments to authenticated;
revoke all on public.dismissed_comments from anon, public;

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  reason text not null check (reason in ('ai_slop', 'other')),
  created_at timestamptz not null default now(),
  unique (reporter_id, comment_id, reason)
);

create index if not exists comment_reports_created_idx
  on public.comment_reports (created_at desc);

alter table public.comment_reports enable row level security;

drop policy if exists "comment reports own read" on public.comment_reports;
create policy "comment reports own read" on public.comment_reports
  for select to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "comment reports own write" on public.comment_reports;
create policy "comment reports own write" on public.comment_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1
      from public.feed_comments c
      where c.id = comment_id
        and c.author_id <> auth.uid()
    )
  );

grant select, insert on public.comment_reports to authenticated;
revoke all on public.comment_reports from anon, public;

create or replace view public.feed_comments
with (security_barrier = true)
as
select c.*
from public.feed_comments_unfiltered c
join public.posts p on p.id = c.post_id
where public.can_read_post_comments(p.id)
  and not exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = c.author_id)
       or (b.blocker_id = c.author_id and b.blocked_id = auth.uid())
  )
  and not exists (
    select 1
    from public.dismissed_comments d
    where d.user_id = auth.uid()
      and d.comment_id = c.id
  );

grant select on public.feed_comments to anon, authenticated;

notify pgrst, 'reload schema';

commit;

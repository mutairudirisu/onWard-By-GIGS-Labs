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

create table if not exists public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reaction   text not null check (reaction in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_reactions_post_idx
  on public.post_reactions (post_id, reaction);

alter table public.post_reactions enable row level security;

drop policy if exists "post reactions own read" on public.post_reactions;
create policy "post reactions own read"
  on public.post_reactions for select to authenticated
  using (user_id = auth.uid());

grant select on public.post_reactions to authenticated;

insert into public.post_reactions (post_id, user_id, reaction, created_at)
select post_id, user_id, 'like', created_at
from public.post_likes
on conflict (post_id, user_id) do nothing;

create or replace function public.set_post_reaction(p_post_id uuid, p_reaction text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sign in to react to a post.';
  end if;

  if p_reaction is not null and p_reaction not in ('like', 'love') then
    raise exception 'Unsupported post reaction.';
  end if;

  if not public.can_view_post(p_post_id) then
    raise exception 'This post is not available.';
  end if;

  if p_reaction is null then
    delete from public.post_reactions
      where post_id = p_post_id and user_id = current_user_id;
    delete from public.post_likes
      where post_id = p_post_id and user_id = current_user_id;
    return;
  end if;

  insert into public.post_reactions (post_id, user_id, reaction)
  values (p_post_id, current_user_id, p_reaction)
  on conflict (post_id, user_id)
  do update set reaction = excluded.reaction, created_at = now();

  if p_reaction = 'like' then
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, current_user_id)
    on conflict (post_id, user_id) do nothing;
  else
    delete from public.post_likes
      where post_id = p_post_id and user_id = current_user_id;
  end if;
end;
$$;

revoke all on function public.set_post_reaction(uuid, text) from public, anon;
grant execute on function public.set_post_reaction(uuid, text) to authenticated;

create or replace view public.post_reaction_counts
with (security_barrier = true)
as
select r.post_id, r.reaction, count(*)::int as total
from public.post_reactions r
where public.can_view_post(r.post_id)
group by r.post_id, r.reaction;

grant select on public.post_reaction_counts to anon, authenticated;

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

commit;

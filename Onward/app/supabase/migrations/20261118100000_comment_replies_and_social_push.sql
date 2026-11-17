begin;

alter table public.push_jobs
  drop constraint if exists push_jobs_kind_check;

alter table public.push_jobs
  add constraint push_jobs_kind_check
  check (kind in ('checklist', 'focus', 'broadcast', 'post', 'comment', 'reply'));

alter table public.post_comments
  add column if not exists parent_comment_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_comments'::regclass
      and conname = 'post_comments_id_post_id_key'
  ) then
    alter table public.post_comments
      add constraint post_comments_id_post_id_key unique (id, post_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_comments'::regclass
      and conname = 'post_comments_parent_same_post_fkey'
  ) then
    alter table public.post_comments
      add constraint post_comments_parent_same_post_fkey
      foreign key (parent_comment_id, post_id)
      references public.post_comments (id, post_id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_comments'::regclass
      and conname = 'post_comments_parent_not_self_check'
  ) then
    alter table public.post_comments
      add constraint post_comments_parent_not_self_check
      check (parent_comment_id is null or parent_comment_id <> id);
  end if;
end;
$$;

create index if not exists post_comments_parent_idx
  on public.post_comments (post_id, parent_comment_id, created_at);

create or replace function public.enforce_comment_root_parent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent_post_id uuid;
  v_parent_parent_id uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select c.post_id, c.parent_comment_id
    into v_parent_post_id, v_parent_parent_id
    from public.post_comments c
   where c.id = new.parent_comment_id;

  if not found or v_parent_post_id <> new.post_id or v_parent_parent_id is not null then
    raise exception 'A reply must belong to a top-level comment on the same post.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists post_comments_root_parent_guard on public.post_comments;
create trigger post_comments_root_parent_guard
before insert or update of parent_comment_id, post_id on public.post_comments
for each row execute function public.enforce_comment_root_parent();

revoke all on function public.enforce_comment_root_parent() from public, anon, authenticated;

create or replace view public.feed_comments_unfiltered
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
  c.media,
  p.avatar_url,
  p.role,
  c.parent_comment_id
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
  )
  and (
    c.parent_comment_id is null
    or exists (
      select 1
      from public.feed_comments_unfiltered parent
      where parent.id = c.parent_comment_id
        and not exists (
          select 1
          from public.user_blocks b
          where (b.blocker_id = auth.uid() and b.blocked_id = parent.author_id)
             or (b.blocker_id = parent.author_id and b.blocked_id = auth.uid())
        )
        and not exists (
          select 1
          from public.dismissed_comments d
          where d.user_id = auth.uid()
            and d.comment_id = parent.id
        )
    )
  );

grant select on public.feed_comments to anon, authenticated;

create or replace function public.enqueue_social_post_push_jobs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.channel_id is not null then
    delete from public.push_jobs
     where id like 'social:post:' || new.id::text || ':%'
       and sent_at is null;
    return new;
  end if;

  delete from public.push_jobs
   where id like 'social:post:' || new.id::text || ':%'
     and sent_at is null;

  with recipients as (
    select f.follower_id as user_id
    from public.follows f
    where new.community_id is null
      and new.audience = 'anyone'
      and f.following_id = new.user_id
    union
    select f1.follower_id as user_id
    from public.follows f1
    join public.follows f2
      on f2.follower_id = f1.following_id
     and f2.following_id = f1.follower_id
    where new.community_id is null
      and new.audience = 'connections'
      and f1.following_id = new.user_id
    union
    select cm.user_id
    from public.community_members cm
    where new.community_id is not null
      and cm.community_id = new.community_id
  )
  insert into public.push_jobs as queued (
    id, user_id, kind, scheduled_at, title, body, href, data
  )
  select
    'social:post:' || new.id::text || ':' || r.user_id::text,
    r.user_id,
    'post',
    coalesce(new.scheduled_at, now()),
    'New post from ' || coalesce(nullif(trim(author.display_name), ''), 'Someone'),
    coalesce(
      nullif(left(regexp_replace(coalesce(new.body, ''), '[[:space:]]+', ' ', 'g'), 140), ''),
      'Shared a new post.'
    ),
    '/feed/' || new.id::text,
    jsonb_build_object('type', 'post', 'postId', new.id)
  from recipients r
  join public.push_subscriptions s on s.user_id = r.user_id
  left join public.user_settings settings on settings.user_id = r.user_id
  join public.profiles author on author.id = new.user_id
  where r.user_id <> new.user_id
    and coalesce(settings.notifications, true)
    and not exists (
      select 1
      from public.user_blocks b
      where (b.blocker_id = r.user_id and b.blocked_id = new.user_id)
         or (b.blocker_id = new.user_id and b.blocked_id = r.user_id)
    )
  on conflict (id) do update
    set scheduled_at = excluded.scheduled_at,
        title = excluded.title,
        body = excluded.body,
        href = excluded.href,
        data = excluded.data,
        updated_at = now()
    where queued.sent_at is null;

  if new.audience not in ('anyone', 'connections') and new.community_id is null then
    delete from public.push_jobs
     where id like 'social:post:' || new.id::text || ':%'
       and sent_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_social_push_enqueue on public.posts;
create trigger posts_social_push_enqueue
after insert or update of body, audience, scheduled_at, community_id, channel_id
on public.posts
for each row execute function public.enqueue_social_post_push_jobs();

revoke all on function public.enqueue_social_post_push_jobs() from public, anon, authenticated;

create or replace function public.delete_pending_social_post_push_jobs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.push_jobs
   where id like 'social:post:' || old.id::text || ':%'
     and sent_at is null;
  return old;
end;
$$;

drop trigger if exists posts_social_push_cleanup on public.posts;
create trigger posts_social_push_cleanup
after delete on public.posts
for each row execute function public.delete_pending_social_post_push_jobs();

revoke all on function public.delete_pending_social_post_push_jobs() from public, anon, authenticated;

create or replace function public.enqueue_social_comment_push_jobs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_name text;
  v_post_author uuid;
  v_parent_author uuid;
  v_kind text;
  v_excerpt text;
begin
  select p.user_id
    into v_post_author
    from public.posts p
   where p.id = new.post_id;

  if new.parent_comment_id is not null then
    select c.user_id
      into v_parent_author
      from public.post_comments c
     where c.id = new.parent_comment_id;
  end if;

  select coalesce(nullif(trim(p.display_name), ''), 'Someone')
    into v_actor_name
    from public.profiles p
   where p.id = new.user_id;
  v_actor_name := coalesce(v_actor_name, 'Someone');

  v_kind := case when new.parent_comment_id is null then 'comment' else 'reply' end;
  v_excerpt := coalesce(
    nullif(left(regexp_replace(coalesce(new.body, ''), '[[:space:]]+', ' ', 'g'), 120), ''),
    'Shared a photo or file.'
  );

  with recipients as (
    select v_post_author as user_id
    union
    select v_parent_author as user_id
  )
  insert into public.push_jobs (
    id, user_id, kind, scheduled_at, title, body, href, data
  )
  select
    'social:' || v_kind || ':' || new.id::text || ':' || r.user_id::text,
    r.user_id,
    v_kind,
    now(),
    case
      when v_kind = 'reply' then 'New reply to your comment'
      else 'New comment on your post'
    end,
    v_actor_name || ': ' || v_excerpt,
    '/feed/' || new.post_id::text || '?focus=comments',
    jsonb_build_object(
      'type', v_kind,
      'postId', new.post_id,
      'commentId', new.id,
      'parentCommentId', new.parent_comment_id
    )
  from recipients r
  join public.push_subscriptions s on s.user_id = r.user_id
  left join public.user_settings settings on settings.user_id = r.user_id
  where r.user_id is not null
    and r.user_id <> new.user_id
    and coalesce(settings.notifications, true)
    and not exists (
      select 1
      from public.user_blocks b
      where (b.blocker_id = r.user_id and b.blocked_id = new.user_id)
         or (b.blocker_id = new.user_id and b.blocked_id = r.user_id)
    )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists post_comments_social_push_enqueue on public.post_comments;
create trigger post_comments_social_push_enqueue
after insert on public.post_comments
for each row execute function public.enqueue_social_comment_push_jobs();

revoke all on function public.enqueue_social_comment_push_jobs() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;

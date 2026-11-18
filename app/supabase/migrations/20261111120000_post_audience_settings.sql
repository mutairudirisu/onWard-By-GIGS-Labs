begin;

alter table public.posts
  add column if not exists audience text not null default 'anyone'
    check (audience in ('anyone', 'connections', 'channel')),
  add column if not exists comment_audience text not null default 'anyone'
    check (comment_audience in ('anyone', 'connections', 'off')),
  add column if not exists brand_partnership boolean not null default false,
  add column if not exists brand_partner_name text not null default ''
    check (char_length(brand_partner_name) <= 120);

alter table public.posts
  drop constraint if exists posts_brand_partner_name_check,
  add constraint posts_brand_partner_name_check
    check (
      (brand_partnership and char_length(btrim(brand_partner_name)) > 0)
      or (not brand_partnership and brand_partner_name = '')
    );

create table if not exists public.post_collaborators (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_collaborators_user_idx
  on public.post_collaborators (user_id, created_at desc);

alter table public.post_collaborators enable row level security;

create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        p.user_id = auth.uid()
        or p.audience = 'anyone'
        or (
          p.audience = 'connections'
          and exists (
            select 1
            from public.follows f1
            join public.follows f2
              on f2.follower_id = f1.following_id
             and f2.following_id = f1.follower_id
            where f1.follower_id = p.user_id
              and f1.following_id = auth.uid()
          )
        )
        or (
          p.audience = 'channel'
          and p.channel_id is not null
          and exists (
            select 1 from public.channel_members cm
            where cm.channel_id = p.channel_id
              and cm.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.can_comment_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and public.can_view_post(p.id)
      and (
        p.comment_audience = 'anyone'
        or (
          p.comment_audience = 'connections'
          and (
            p.user_id = auth.uid()
            or exists (
              select 1
              from public.follows f1
              join public.follows f2
                on f2.follower_id = f1.following_id
               and f2.following_id = f1.follower_id
              where f1.follower_id = p.user_id
                and f1.following_id = auth.uid()
            )
          )
        )
      )
  );
$$;

create or replace function public.can_read_post_comments(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_comment_post(p_post_id);
$$;

create or replace function public.is_public_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id and p.audience = 'anyone'
  );
$$;

create or replace function public.can_view_comment(p_comment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.post_comments c
    where c.id = p_comment_id
      and public.can_read_post_comments(c.post_id)
  );
$$;

revoke all on function public.can_view_post(uuid) from public, anon;
revoke all on function public.can_comment_post(uuid) from public, anon;
revoke all on function public.can_read_post_comments(uuid) from public, anon;
revoke all on function public.is_public_post(uuid) from public, anon;
revoke all on function public.can_view_comment(uuid) from public, anon;
grant execute on function public.can_view_post(uuid) to anon, authenticated;
grant execute on function public.can_comment_post(uuid) to anon, authenticated;
grant execute on function public.can_read_post_comments(uuid) to anon, authenticated;
grant execute on function public.is_public_post(uuid) to authenticated;
grant execute on function public.can_view_comment(uuid) to authenticated;

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
        where public.can_view_post(p.id)
          and (p.title <> '' or p.body <> '')
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

drop policy if exists "post collaborators visible to readers" on public.post_collaborators;
create policy "post collaborators visible to readers" on public.post_collaborators
  for select to anon, authenticated
  using (public.can_view_post(post_id));

drop policy if exists "post owners tag collaborators" on public.post_collaborators;
create policy "post owners tag collaborators" on public.post_collaborators
  for insert to authenticated
  with check (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
    and user_id <> auth.uid()
  );

drop policy if exists "post owners remove collaborator tags" on public.post_collaborators;
create policy "post owners remove collaborator tags" on public.post_collaborators
  for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

grant select on public.post_collaborators to anon, authenticated;
grant insert, delete on public.post_collaborators to authenticated;

create or replace function public.limit_post_collaborators()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.posts where id = new.post_id for update;
  if (
    select count(*) from public.post_collaborators pc
    where pc.post_id = new.post_id
  ) >= 5 then
    raise exception 'A post can tag up to five collaborators';
  end if;
  return new;
end;
$$;

drop trigger if exists post_collaborators_max_five on public.post_collaborators;
create trigger post_collaborators_max_five
  before insert on public.post_collaborators
  for each row execute function public.limit_post_collaborators();

-- A private post cannot point at files in the public media bucket.
create or replace function public.reject_private_post_media()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.posts p
    where p.id = new.post_id and p.audience <> 'anyone'
  ) then
    raise exception 'Media attachments are only supported on public posts';
  end if;
  return new;
end;
$$;

drop trigger if exists post_media_public_audience on public.post_media;
create trigger post_media_public_audience
  before insert on public.post_media
  for each row execute function public.reject_private_post_media();

drop trigger if exists post_documents_public_audience on public.post_documents;
create trigger post_documents_public_audience
  before insert on public.post_documents
  for each row execute function public.reject_private_post_media();

drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      audience <> 'channel'
      or (
        channel_id is not null
        and exists (
          select 1 from public.channel_members cm
          where cm.channel_id = posts.channel_id and cm.user_id = auth.uid()
        )
      )
    )
  );

create or replace function public.validate_post_reshare()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.reshare_of is not null and not exists (
    select 1 from public.posts original
    where original.id = new.reshare_of
      and original.audience = 'anyone'
  ) then
    raise exception 'Only public posts can be reshared';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_public_reshare_only on public.posts;
create trigger posts_public_reshare_only
  before insert on public.posts
  for each row execute function public.validate_post_reshare();

create or replace function public.validate_poll_audience()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_id uuid;
begin
  select pp.post_id into post_id
  from public.post_polls pp
  where pp.id = new.poll_id;
  if post_id is null or not public.can_view_post(post_id) then
    raise exception 'You cannot vote in this poll';
  end if;
  return new;
end;
$$;

drop trigger if exists post_poll_votes_audience on public.post_poll_votes;
create trigger post_poll_votes_audience
  before insert or update on public.post_poll_votes
  for each row execute function public.validate_poll_audience();

drop policy if exists "shares own write" on public.post_shares;
create policy "shares own write" on public.post_shares
  for insert to authenticated
  with check (
    from_user = auth.uid()
    and public.is_public_post(post_id)
  );

drop policy if exists "comments owner write" on public.post_comments;
create policy "comments owner write" on public.post_comments
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_comment_post(post_id));

drop policy if exists "likes own write" on public.post_likes;
create policy "likes own write" on public.post_likes
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));

drop policy if exists "comment likes own write" on public.comment_likes;
create policy "comment likes own write" on public.comment_likes
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_comment(comment_id));

-- Keep the existing feed projection intact, but place an access-checked view in front
-- of it so every current client query remains compatible.
alter view public.feed_posts rename to feed_posts_unfiltered;
revoke all on public.feed_posts_unfiltered from anon, authenticated;

create view public.feed_posts
with (security_barrier = true)
as
select
  f.id,
  f.created_at,
  f.body,
  f.ward_id,
  f.full_name,
  f.first_name,
  f.initials,
  f.avatar_url,
  f.role,
  f.mine,
  f.media,
  f.likes,
  case when public.can_comment_post(p.id) then f.comments else 0 end as comments,
  case
    when public.can_comment_post(p.id) then f.recent_comments
    else '[]'::jsonb
  end as recent_comments,
  f.title,
  f.reshare_of,
  f.reshares,
  f.reshared,
  f.reshare,
  f.author_id,
  f.channel_id,
  f.channel_name,
  p.audience as post_audience,
  p.comment_audience,
  p.brand_partnership,
  p.brand_partner_name,
  public.can_comment_post(p.id) as can_comment,
  coalesce(collaborators.people, '[]'::jsonb) as collaborators
from public.feed_posts_unfiltered f
join public.posts p on p.id = f.id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', pf.id,
      'name', pf.display_name,
      'initials', pf.initials,
      'avatar_url', pf.avatar_url
    ) order by pf.display_name
  ) as people
  from public.post_collaborators pc
  join public.profiles pf on pf.id = pc.user_id
  where pc.post_id = p.id
) collaborators on true
where public.can_view_post(p.id);

grant select on public.feed_posts to anon, authenticated;

alter view public.feed_comments rename to feed_comments_unfiltered;
revoke all on public.feed_comments_unfiltered from anon, authenticated;

create view public.feed_comments
with (security_barrier = true)
as
select c.*
from public.feed_comments_unfiltered c
join public.posts p on p.id = c.post_id
where public.can_read_post_comments(p.id);

grant select on public.feed_comments to anon, authenticated;

alter view public.feed_polls rename to feed_polls_unfiltered;
revoke all on public.feed_polls_unfiltered from anon, authenticated;

create view public.feed_polls
with (security_barrier = true)
as
select poll.*
from public.feed_polls_unfiltered poll
where public.can_view_post(poll.post_id);

grant select on public.feed_polls to anon, authenticated;

alter view public.profile_comments rename to profile_comments_unfiltered;
revoke all on public.profile_comments_unfiltered from anon, authenticated;

create view public.profile_comments
with (security_barrier = true)
as
select comment_row.*
from public.profile_comments_unfiltered comment_row
where public.can_read_post_comments(comment_row.post_id);

grant select on public.profile_comments to anon, authenticated;

commit;

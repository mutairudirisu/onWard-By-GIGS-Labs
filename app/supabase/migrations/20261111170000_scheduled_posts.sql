begin;

alter table public.posts
  add column if not exists scheduled_at timestamptz;

create index if not exists posts_scheduled_at_idx
  on public.posts (scheduled_at)
  where scheduled_at is not null;

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
      and (p.scheduled_at is null or p.scheduled_at <= now())
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
      )
  );
$$;

create or replace view public.feed_posts
with (security_barrier = true)
as
select
  f.id,
  coalesce(p.scheduled_at, f.created_at) as created_at,
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
  coalesce(collaborators.people, '[]'::jsonb) as collaborators,
  p.scheduled_at
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
  coalesce(me.followed, false) as followed
from public.profiles pf
left join lateral (
  select count(*) as followers from public.follows f where f.following_id = pf.id
) fl on true
left join lateral (
  select count(*) as following from public.follows f2 where f2.follower_id = pf.id
) fg on true
left join lateral (
  select count(*) as posts
  from public.posts p
  where p.user_id = pf.id
    and (p.scheduled_at is null or p.scheduled_at <= now())
) ps on true
left join lateral (
  select count(*) as comments from public.post_comments c where c.user_id = pf.id
) cm on true
left join lateral (
  select true as followed from public.follows f3
  where f3.following_id = pf.id and f3.follower_id = auth.uid()
) me on true;

grant select on public.profile_cards to anon, authenticated;

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
          'created_at', coalesce(p.scheduled_at, p.created_at)
        ) as entry
        from public.posts p
        join public.profiles pa on pa.id = p.user_id, q
        where public.can_view_post(p.id)
          and (p.title <> '' or p.body <> '')
          and (q.term = ''
               or position(q.term in lower(p.title)) > 0
               or position(q.term in lower(p.body)) > 0)
        order by (q.term <> '' and position(q.term in lower(p.title)) > 0) desc,
                 coalesce(p.scheduled_at, p.created_at) desc
        limit 8
      ) x
    )
  );
$$;

revoke all on function public.search_exchange(text) from public;
grant execute on function public.search_exchange(text) to anon, authenticated;

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
  v_opens_at timestamptz;
  v_id    uuid;
  v_label text;
  v_sort  int := 0;
begin
  if auth.uid() is null then
    raise exception 'sign in to run a poll' using errcode = '42501';
  end if;

  select user_id, coalesce(scheduled_at, now())
    into v_owner, v_opens_at
  from public.posts
  where id = p_post_id;
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
  if p_ends_at is null
    or p_ends_at <= v_opens_at + interval '10 minutes'
    or p_ends_at > v_opens_at + interval '30 days' then
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

commit;

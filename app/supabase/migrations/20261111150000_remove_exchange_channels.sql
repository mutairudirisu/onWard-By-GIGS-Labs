begin;

-- Keep existing rows intact, but make legacy channel-only posts visible only to
-- their author and prevent new posts or API calls from using channels.
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
      )
  );
$$;

drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and audience <> 'channel'
    and channel_id is null
  );

revoke all on public.channels, public.channel_members from public, anon, authenticated;
revoke all on public.channel_cards from public, anon, authenticated;

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

commit;

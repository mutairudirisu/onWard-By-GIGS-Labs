begin;

alter table public.posts
  add column community_id uuid references public.communities (id) on delete set null,
  add constraint posts_community_public_audience_check
    check (community_id is null or audience = 'anyone');

create index posts_community_created_idx
  on public.posts (community_id, created_at desc)
  where community_id is not null;

drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and audience <> 'channel'
    and channel_id is null
    and (
      community_id is null
      or exists (
        select 1
        from public.community_members cm
        where cm.community_id = public.posts.community_id
          and cm.user_id = auth.uid()
      )
    )
  );

insert into public.posts (id, user_id, body, title, created_at, community_id)
select cp.id, cp.author_id, cp.body, cp.title, cp.created_at, cp.community_id
from public.community_posts cp
on conflict (id) do nothing;

drop view if exists public.community_post_cards;

create or replace view public.community_directory
with (security_barrier = true)
as
select
  c.id,
  c.slug,
  c.name,
  c.topic,
  c.description,
  c.created_at,
  coalesce(m.member_count, 0)::int as member_count,
  coalesce(p.post_count, 0)::int as post_count,
  exists (
    select 1 from public.community_members mine
    where mine.community_id = c.id and mine.user_id = auth.uid()
  ) as is_member,
  c.created_by = auth.uid() as is_owner,
  c.community_type,
  c.is_mature
from public.communities c
left join lateral (
  select count(*) as member_count
  from public.community_members cm
  where cm.community_id = c.id
) m on true
left join lateral (
  select count(*) as post_count
  from public.posts p
  where p.community_id = c.id
) p on true;

grant select on public.community_directory to anon, authenticated;
drop table public.community_posts;

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
  p.scheduled_at,
  p.community_id,
  c.name as community_name,
  c.slug as community_slug,
  c.topic as community_topic,
  exists (
    select 1 from public.community_members cm
    where cm.community_id = p.community_id and cm.user_id = auth.uid()
  ) as community_is_member
from public.feed_posts_unfiltered f
join public.posts p on p.id = f.id
left join public.communities c on c.id = p.community_id
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

commit;

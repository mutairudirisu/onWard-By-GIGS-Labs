begin;

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
  ) as community_is_member,
  c.description as community_description,
  c.avatar_path as community_avatar_path
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

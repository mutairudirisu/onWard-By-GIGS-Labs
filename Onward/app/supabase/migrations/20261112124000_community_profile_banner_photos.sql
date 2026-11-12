begin;

alter table public.communities
  add column avatar_path text,
  add column banner_path text,
  add constraint communities_avatar_path_owner_check
    check (
      avatar_path is null
      or (
        avatar_path ~ '^[0-9a-f-]{36}/communities/[0-9a-f-]{36}[.](jpg|png|webp)$'
        and split_part(avatar_path, '/', 1) = created_by::text
      )
    ),
  add constraint communities_banner_path_owner_check
    check (
      banner_path is null
      or (
        banner_path ~ '^[0-9a-f-]{36}/communities/[0-9a-f-]{36}[.](jpg|png|webp)$'
        and split_part(banner_path, '/', 1) = created_by::text
      )
    );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community media public read" on storage.objects;
create policy "community media public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'community-media');

drop policy if exists "community media owner insert" on storage.objects;
create policy "community media owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "community media owner update" on storage.objects;
create policy "community media owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "community media owner delete" on storage.objects;
create policy "community media owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

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
  c.is_mature,
  c.avatar_path,
  c.banner_path
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

commit;

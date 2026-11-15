begin;

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
        from public.communities c
        where c.id = public.posts.community_id
          and c.created_by = auth.uid()
      )
    )
  );

commit;

-- Avatar uploads replace a user's fixed avatar.jpg object, so allow that owner
-- to update only their own avatar in the public media bucket.
drop policy if exists "profile avatar owner update" on storage.objects;
create policy "profile avatar owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'post-media'
    and name = auth.uid()::text || '/avatar.jpg'
  )
  with check (
    bucket_id = 'post-media'
    and name = auth.uid()::text || '/avatar.jpg'
  );

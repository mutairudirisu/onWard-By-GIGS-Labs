begin;

create table if not exists public.post_documents (
  post_id uuid primary key references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.post_documents enable row level security;

drop policy if exists "post documents own read" on public.post_documents;
create policy "post documents own read" on public.post_documents for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "post documents owner write" on public.post_documents;
create policy "post documents owner write" on public.post_documents for insert to authenticated
  with check (
    user_id = auth.uid()
    and (storage_path like (auth.uid()::text || '/documents/%'))
  );

drop policy if exists "post documents owner delete" on public.post_documents;
create policy "post documents owner delete" on public.post_documents for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.post_documents to authenticated;

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
]
where id = 'post-media';

commit;

begin;

alter table public.direct_messages
  add column if not exists media_path text,
  add column if not exists media_type text,
  add column if not exists media_name text,
  add column if not exists media_size bigint;

alter table public.direct_messages
  drop constraint if exists direct_messages_body_check,
  drop constraint if exists direct_messages_media_fields_check,
  drop constraint if exists direct_messages_media_path_check;

alter table public.direct_messages
  add constraint direct_messages_body_check
    check (
      char_length(btrim(body)) <= 5000
      and (char_length(btrim(body)) > 0 or media_path is not null)
    ),
  add constraint direct_messages_media_fields_check
    check (
      (media_path is null and media_type is null and media_name is null and media_size is null)
      or (
        media_path is not null
        and media_type is not null
        and media_type in ('image', 'video', 'audio', 'file')
        and media_size is not null
        and media_name is not null
        and char_length(media_name) between 1 and 200
        and media_size between 1 and 26214400
      )
    ),
  add constraint direct_messages_media_path_check
    check (
      media_path is null
      or media_path like conversation_id::text || '/' || sender_id::text || '/%'
    );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'direct-message-media',
  'direct-message-media',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Conversation participants can read direct message media"
  on storage.objects;
create policy "Conversation participants can read direct message media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'direct-message-media'
    and exists (
      select 1
      from public.direct_conversations c
      where c.id::text = split_part(storage.objects.name, '/', 1)
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Participants can upload their direct message media"
  on storage.objects;
create policy "Participants can upload their direct message media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'direct-message-media'
    and split_part(storage.objects.name, '/', 2) = auth.uid()::text
    and exists (
      select 1
      from public.direct_conversations c
      where c.id::text = split_part(storage.objects.name, '/', 1)
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Senders can remove their direct message media"
  on storage.objects;
create policy "Senders can remove their direct message media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'direct-message-media'
    and split_part(storage.objects.name, '/', 2) = auth.uid()::text
    and exists (
      select 1
      from public.direct_conversations c
      where c.id::text = split_part(storage.objects.name, '/', 1)
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

create or replace function public.direct_message_inbox()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  display_name text,
  initials text,
  avatar_url text,
  role text,
  last_message text,
  last_message_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    c.id,
    p.id,
    p.display_name,
    p.initials,
    p.avatar_url,
    p.role,
    case
      when nullif(latest.body, '') is not null then latest.body
      when latest.media_type = 'image' then 'Photo'
      when latest.media_type = 'video' then 'Video'
      when latest.media_type = 'audio' then 'Voice message'
      when latest.media_type = 'file' then 'File: ' || latest.media_name
      else latest.body
    end,
    coalesce(latest.created_at, c.created_at)
  from public.direct_conversations c
  join public.profiles p
    on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select m.body, m.created_at, m.media_type, m.media_name
    from public.direct_messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) latest on true
  where auth.uid() in (c.user_a, c.user_b)
  order by coalesce(latest.created_at, c.created_at) desc;
$$;

commit;

notify pgrst, 'reload schema';

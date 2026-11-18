begin;

alter table public.push_jobs
  drop constraint if exists push_jobs_kind_check;

alter table public.push_jobs
  add constraint push_jobs_kind_check
  check (kind in ('checklist', 'focus', 'broadcast', 'post', 'comment', 'reply', 'connection_request'));

create or replace function public.enqueue_connection_request_push_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sender_name text;
  v_sender_avatar_url text;
  v_profile_href text := '/people/' || new.sender_id::text;
begin
  select coalesce(nullif(btrim(p.display_name), ''), 'Someone'), p.avatar_url
    into v_sender_name, v_sender_avatar_url
    from public.profiles p
   where p.id = new.sender_id;

  insert into public.push_jobs (
    id, user_id, kind, scheduled_at, title, body, href, data
  )
  values (
    'social:connection-request:' || new.id::text || ':' || new.recipient_id::text,
    new.recipient_id,
    'connection_request',
    now(),
    coalesce(v_sender_name, 'Someone'),
    'sent you a connection request.',
    v_profile_href,
    jsonb_build_object(
      'requestId', new.id,
      'personId', new.sender_id,
      'avatarUrl', v_sender_avatar_url,
      'profileHref', v_profile_href
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.enqueue_connection_request_push_job() from public, anon, authenticated;

drop trigger if exists connection_request_push_enqueue on public.connection_requests;
create trigger connection_request_push_enqueue
after insert on public.connection_requests
for each row execute function public.enqueue_connection_request_push_job();

create or replace function public.delete_pending_connection_request_push_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.push_jobs
   where id = 'social:connection-request:' || old.id::text || ':' || old.recipient_id::text
     and sent_at is null;
  return old;
end;
$$;

revoke all on function public.delete_pending_connection_request_push_job() from public, anon, authenticated;

drop trigger if exists connection_request_push_cleanup on public.connection_requests;
create trigger connection_request_push_cleanup
after delete on public.connection_requests
for each row execute function public.delete_pending_connection_request_push_job();

commit;

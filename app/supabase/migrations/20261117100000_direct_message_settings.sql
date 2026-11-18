begin;

alter table public.user_settings
  add column if not exists message_privacy text not null default 'everyone'
    check (message_privacy in ('everyone', 'connections')),
  add column if not exists message_read_receipts boolean not null default true,
  add column if not exists message_notifications boolean not null default true;

create or replace function public.open_direct_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_id uuid;
begin
  if v_me is null or p_other_user is null or p_other_user = v_me then
    raise exception 'A valid recipient is required';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user) then
    raise exception 'That profile could not be found';
  end if;
  if coalesce(
    (select s.message_privacy from public.user_settings s where s.user_id = p_other_user),
    'everyone'
  ) = 'connections'
  and not exists (
    select 1
    from public.connections c
    where c.user_a = least(v_me, p_other_user)
      and c.user_b = greatest(v_me, p_other_user)
  ) then
    raise exception 'This person only accepts messages from their connections';
  end if;

  v_a := least(v_me, p_other_user);
  v_b := greatest(v_me, p_other_user);
  insert into public.direct_conversations (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do update set updated_at = public.direct_conversations.updated_at
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.can_send_direct_message(
  p_conversation_id uuid,
  p_sender_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.direct_conversations c
    where c.id = p_conversation_id
      and p_sender_id = auth.uid()
      and auth.uid() in (c.user_a, c.user_b)
      and (
        coalesce(
          (
            select s.message_privacy
            from public.user_settings s
            where s.user_id = case when c.user_a = p_sender_id then c.user_b else c.user_a end
          ),
          'everyone'
        ) = 'everyone'
        or exists (
          select 1
          from public.connections connection
          where connection.user_a = least(c.user_a, c.user_b)
            and connection.user_b = greatest(c.user_a, c.user_b)
        )
      )
  );
$$;

revoke all on function public.can_send_direct_message(uuid, uuid) from public, anon;
grant execute on function public.can_send_direct_message(uuid, uuid) to authenticated;

drop policy if exists "Participants can send their own direct messages"
  on public.direct_messages;
create policy "Participants can send their own direct messages"
  on public.direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_send_direct_message(conversation_id, sender_id)
  );

create or replace function public.mark_direct_messages_read(p_conversation_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reader uuid := auth.uid();
  v_read_at timestamptz := now();
begin
  if v_reader is null or not exists (
    select 1
    from public.direct_conversations c
    where c.id = p_conversation_id
      and v_reader in (c.user_a, c.user_b)
  ) then
    raise exception 'This conversation is unavailable';
  end if;
  if not coalesce(
    (select s.message_read_receipts from public.user_settings s where s.user_id = v_reader),
    true
  ) then
    return v_read_at;
  end if;

  update public.direct_messages
  set read_at = v_read_at
  where conversation_id = p_conversation_id
    and sender_id <> v_reader
    and read_at is null;

  return v_read_at;
end;
$$;

revoke all on function public.open_direct_conversation(uuid) from public, anon;
grant execute on function public.open_direct_conversation(uuid) to authenticated;
revoke all on function public.mark_direct_messages_read(uuid) from public, anon;
grant execute on function public.mark_direct_messages_read(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';

begin;

alter table public.direct_messages
  add column if not exists read_at timestamptz;

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

  update public.direct_messages
  set read_at = v_read_at
  where conversation_id = p_conversation_id
    and sender_id <> v_reader
    and read_at is null;

  return v_read_at;
end;
$$;

revoke all on function public.mark_direct_messages_read(uuid) from public, anon;
grant execute on function public.mark_direct_messages_read(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';

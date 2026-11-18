begin;

drop policy if exists "Direct conversation participants can read presence"
  on realtime.messages;
create policy "Direct conversation participants can read presence"
  on realtime.messages for select to authenticated
  using (
    extension = 'presence'
    and exists (
      select 1
      from public.direct_conversations c
      where c.id::text = split_part(realtime.topic(), ':', 2)
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Direct conversation participants can send presence"
  on realtime.messages;
create policy "Direct conversation participants can send presence"
  on realtime.messages for insert to authenticated
  with check (
    extension = 'presence'
    and exists (
      select 1
      from public.direct_conversations c
      where c.id::text = split_part(realtime.topic(), ':', 2)
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

commit;

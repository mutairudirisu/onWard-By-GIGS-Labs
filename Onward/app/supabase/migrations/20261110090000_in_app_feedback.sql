-- What people say about the app, kept for the people who run it.
--
-- The question is the two-tap one - "How is onWard so far?" - so the answer is stored
-- as the tap itself and the words are optional. A rating with no words still counts;
-- words with no rating never happen, because the card cannot be sent before a tap.
--
-- screen says where the question was asked, so "not really" from someone who has only
-- just arrived reads differently from "not really" from someone who came back after a
-- month away. It is free text rather than an enum: a new place to ask should not need
-- a migration.
--
-- There is no update and no delete policy. Feedback is a statement, not a record
-- someone keeps editing, and a row that can be withdrawn is a row that quietly
-- disappears from the count the admin sees.
begin;

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  -- Filled from the token, so nobody can put words in someone else's mouth.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  answer     text not null check (answer in ('love_it', 'not_really')),
  body       text not null default '' check (char_length(body) <= 1000),
  screen     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback own read" on public.feedback;
create policy "feedback own read" on public.feedback for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "feedback own write" on public.feedback;
create policy "feedback own write" on public.feedback for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.feedback to authenticated;

-- --------------------------------------------------------------- the admin console
-- One call for the whole list, newest first, with whoever said it attached. Reading
-- other people's rows is only ever possible through here, and only for someone with a
-- row in public.admins - the same gate every other admin call uses.
create or replace function public.admin_feedback()
returns table (
  id         uuid,
  created_at timestamptz,
  answer     text,
  body       text,
  screen     text,
  display_name text,
  email      text,
  role       text,
  plan       text
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not internal.is_admin() then
    raise exception 'not authorised';
  end if;

  return query
  select
    f.id,
    f.created_at,
    f.answer,
    f.body,
    f.screen,
    p.display_name,
    u.email,
    p.role,
    p.plan
  from public.feedback f
  left join public.profiles p on p.id = f.user_id
  left join auth.users u on u.id = f.user_id
  order by f.created_at desc;
end;
$$;

revoke all on function public.admin_feedback() from public, anon;
grant execute on function public.admin_feedback() to authenticated;

commit;

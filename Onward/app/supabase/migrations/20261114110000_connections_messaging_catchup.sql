begin;

create table if not exists public.connections (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

alter table public.connections enable row level security;

create policy "Users can read their connections"
  on public.connections for select to authenticated
  using (auth.uid() in (user_a, user_b));

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);

create index if not exists connection_requests_recipient_idx
  on public.connection_requests (recipient_id, created_at desc);
create unique index if not exists connection_requests_pair_unique
  on public.connection_requests (least(sender_id, recipient_id), greatest(sender_id, recipient_id));

alter table public.connection_requests enable row level security;

create policy "Users can read their connection requests"
  on public.connection_requests for select to authenticated
  using (auth.uid() in (sender_id, recipient_id));

create table if not exists public.network_profile_details (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  school text not null default '' check (char_length(school) <= 160),
  birthday date,
  share_birthday boolean not null default false,
  current_employer text not null default '' check (char_length(current_employer) <= 160),
  employment_start_date date,
  share_work_events boolean not null default false,
  updated_at timestamptz not null default now(),
  check (birthday is null or birthday <= current_date),
  check (employment_start_date is null or employment_start_date <= current_date)
);

alter table public.network_profile_details enable row level security;

create policy "Users can manage their private network details"
  on public.network_profile_details for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.network_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type = 'job_change'),
  role text not null default '',
  employer text not null default '',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, occurred_on)
);

create index if not exists network_events_user_date_idx
  on public.network_events (user_id, occurred_on desc);

alter table public.network_events enable row level security;

create table if not exists public.network_catchup_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_viewed_at timestamptz not null default now()
);

alter table public.network_catchup_state enable row level security;

create policy "Users can manage their catch-up state"
  on public.network_catchup_state for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

alter table public.direct_conversations enable row level security;

create policy "Participants can read their conversations"
  on public.direct_conversations for select to authenticated
  using (auth.uid() in (user_a, user_b));

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_date_idx
  on public.direct_messages (conversation_id, created_at desc);

alter table public.direct_messages enable row level security;
alter table public.direct_messages replica identity full;

create policy "Participants can read direct messages"
  on public.direct_messages for select to authenticated
  using (
    exists (
      select 1
      from public.direct_conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "Participants can send their own direct messages"
  on public.direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.direct_conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

create or replace function public.touch_direct_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.direct_conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists direct_messages_touch_conversation on public.direct_messages;
create trigger direct_messages_touch_conversation
  after insert on public.direct_messages
  for each row execute function public.touch_direct_conversation();

create or replace function public.send_connection_request(p_recipient uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sender uuid := auth.uid();
  v_a uuid;
  v_b uuid;
begin
  if v_sender is null or p_recipient is null or p_recipient = v_sender then
    raise exception 'A valid recipient is required';
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient) then
    raise exception 'That profile could not be found';
  end if;

  v_a := least(v_sender, p_recipient);
  v_b := greatest(v_sender, p_recipient);
  if exists (select 1 from public.connections where user_a = v_a and user_b = v_b)
     or exists (
       select 1 from public.connection_requests
       where (sender_id = v_sender and recipient_id = p_recipient)
          or (sender_id = p_recipient and recipient_id = v_sender)
     ) then
    return false;
  end if;

  insert into public.connection_requests (sender_id, recipient_id)
  values (v_sender, p_recipient)
  on conflict do nothing;
  return found;
end;
$$;

create or replace function public.respond_to_connection_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sender uuid;
  v_recipient uuid;
begin
  select sender_id, recipient_id into v_sender, v_recipient
  from public.connection_requests
  where id = p_request_id and recipient_id = auth.uid()
  for update;
  if not found then
    raise exception 'This connection request is no longer available';
  end if;

  if p_accept then
    insert into public.connections (user_a, user_b)
    values (least(v_sender, v_recipient), greatest(v_sender, v_recipient))
    on conflict do nothing;
  end if;
  delete from public.connection_requests where id = p_request_id;
end;
$$;

create or replace function public.network_connection_requests()
returns table (
  request_id uuid,
  person_id uuid,
  direction text,
  requested_at timestamptz,
  display_name text,
  initials text,
  avatar_url text,
  role text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    r.id,
    case when r.recipient_id = auth.uid() then sender.id else recipient.id end,
    case when r.recipient_id = auth.uid() then 'incoming' else 'outgoing' end,
    r.created_at,
    case when r.recipient_id = auth.uid() then sender.display_name else recipient.display_name end,
    case when r.recipient_id = auth.uid() then sender.initials else recipient.initials end,
    case when r.recipient_id = auth.uid() then sender.avatar_url else recipient.avatar_url end,
    case when r.recipient_id = auth.uid() then sender.role else recipient.role end
  from public.connection_requests r
  join public.profiles sender on sender.id = r.sender_id
  join public.profiles recipient on recipient.id = r.recipient_id
  where auth.uid() in (r.sender_id, r.recipient_id)
  order by r.created_at desc;
$$;

create or replace function public.network_suggestions()
returns table (
  id uuid,
  display_name text,
  initials text,
  avatar_url text,
  role text,
  reason text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with me as (
    select p.role, d.school
    from public.profiles p
    left join public.network_profile_details d on d.user_id = p.id
    where p.id = auth.uid()
  ),
  candidates as (
    select
      p.id,
      p.display_name,
      p.initials,
      p.avatar_url,
      p.role,
      case
        when nullif(btrim(d.school), '') is not null
          and lower(btrim(d.school)) = lower(btrim(me.school)) then 'Same school'
        when nullif(btrim(p.role), '') is not null
          and lower(btrim(p.role)) = lower(btrim(me.role)) then 'Similar role'
        when mutual.count > 0 then mutual.count::text || ' mutual connection' ||
          case when mutual.count = 1 then '' else 's' end
        else 'Suggested for you'
      end as reason,
      case
        when nullif(btrim(d.school), '') is not null
          and lower(btrim(d.school)) = lower(btrim(me.school)) then 3
        when nullif(btrim(p.role), '') is not null
          and lower(btrim(p.role)) = lower(btrim(me.role)) then 2
        when mutual.count > 0 then 1
        else 0
      end as score,
      mutual.count as mutual_count
    from public.profiles p
    cross join me
    left join public.network_profile_details d on d.user_id = p.id
    cross join lateral (
      select count(*)::int as count
      from public.connections mine
      join public.connections theirs
        on (case when theirs.user_a = p.id then theirs.user_b else theirs.user_a end)
         = (case when mine.user_a = auth.uid() then mine.user_b else mine.user_a end)
      where auth.uid() in (mine.user_a, mine.user_b)
        and p.id in (theirs.user_a, theirs.user_b)
        and p.id <> auth.uid()
    ) mutual
    where p.id <> auth.uid()
      and (
        (nullif(btrim(d.school), '') is not null
          and lower(btrim(d.school)) = lower(btrim(me.school)))
        or (nullif(btrim(p.role), '') is not null
          and lower(btrim(p.role)) = lower(btrim(me.role)))
        or mutual.count > 0
      )
      and not exists (
        select 1 from public.connections c
        where auth.uid() in (c.user_a, c.user_b)
          and p.id in (c.user_a, c.user_b)
      )
      and not exists (
        select 1 from public.connection_requests r
        where (r.sender_id = auth.uid() and r.recipient_id = p.id)
           or (r.sender_id = p.id and r.recipient_id = auth.uid())
      )
  )
  select c.id, c.display_name, c.initials, c.avatar_url, c.role, c.reason
  from candidates c
  order by c.score desc, c.mutual_count desc, c.display_name
  limit 40;
$$;

create or replace function public.network_connections()
returns table (
  id uuid,
  display_name text,
  initials text,
  avatar_url text,
  role text,
  location text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.display_name, p.initials, p.avatar_url, p.role, p.location
  from public.connections c
  join public.profiles p
    on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  where auth.uid() in (c.user_a, c.user_b)
  order by p.display_name;
$$;

create or replace function public.connection_status(p_other_user uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null or p_other_user is null or p_other_user = auth.uid() then 'none'
    when exists (
      select 1 from public.connections c
      where (c.user_a = auth.uid() and c.user_b = p_other_user)
         or (c.user_b = auth.uid() and c.user_a = p_other_user)
    ) then 'connected'
    when exists (
      select 1 from public.connection_requests r
      where r.sender_id = auth.uid() and r.recipient_id = p_other_user
    ) then 'outgoing'
    when exists (
      select 1 from public.connection_requests r
      where r.sender_id = p_other_user and r.recipient_id = auth.uid()
    ) then 'incoming'
    else 'none'
  end;
$$;

create or replace function public.get_network_catchup_since()
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select s.last_viewed_at from public.network_catchup_state s where s.user_id = auth.uid()),
    now() - interval '30 days'
  );
$$;

create or replace function public.mark_network_catchup_seen()
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seen_at timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.network_catchup_state (user_id, last_viewed_at)
  values (auth.uid(), v_seen_at)
  on conflict (user_id) do update set last_viewed_at = excluded.last_viewed_at;
  return v_seen_at;
end;
$$;

create or replace function public.network_catchup_events(p_since timestamptz)
returns table (
  event_id text,
  user_id uuid,
  event_type text,
  event_date date,
  full_name text,
  initials text,
  avatar_url text,
  role text,
  organization text,
  years int
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with connected as (
    select case when c.user_a = auth.uid() then c.user_b else c.user_a end as user_id
    from public.connections c
    where auth.uid() in (c.user_a, c.user_b)
  ),
  birthdays as (
    select distinct on (d.user_id)
      'birthday:' || d.user_id::text || ':' || dates.event_date::text as event_id,
      d.user_id,
      'birthday'::text as event_type,
      dates.event_date,
      p.display_name as full_name,
      p.initials,
      p.avatar_url,
      p.role,
      ''::text as organization,
      null::int as years
    from connected c
    join public.network_profile_details d on d.user_id = c.user_id
    join public.profiles p on p.id = d.user_id
    cross join lateral generate_series(
      extract(year from p_since::date)::int,
      extract(year from current_date)::int
    ) as y(year)
    cross join lateral (
      select make_date(
        y.year::int,
        extract(month from d.birthday)::int,
        least(
          extract(day from d.birthday)::int,
          extract(day from (
            make_date(y.year::int, extract(month from d.birthday)::int, 1)
              + interval '1 month - 1 day'
          ))::int
        )
      ) as event_date
    ) dates
    where d.birthday is not null
      and d.share_birthday
      and dates.event_date between p_since::date and current_date
    order by d.user_id, dates.event_date desc
  ),
  anniversaries as (
    select distinct on (d.user_id)
      'anniversary:' || d.user_id::text || ':' || dates.event_date::text as event_id,
      d.user_id,
      'work_anniversary'::text as event_type,
      dates.event_date,
      p.display_name as full_name,
      p.initials,
      p.avatar_url,
      p.role,
      d.current_employer as organization,
      extract(year from dates.event_date)::int - extract(year from d.employment_start_date)::int as years
    from connected c
    join public.network_profile_details d on d.user_id = c.user_id
    join public.profiles p on p.id = d.user_id
    cross join lateral generate_series(
      greatest(
        extract(year from p_since::date)::int,
        extract(year from d.employment_start_date)::int + 1
      ),
      extract(year from current_date)::int
    ) as y(year)
    cross join lateral (
      select make_date(
        y.year::int,
        extract(month from d.employment_start_date)::int,
        least(
          extract(day from d.employment_start_date)::int,
          extract(day from (
            make_date(y.year::int, extract(month from d.employment_start_date)::int, 1)
              + interval '1 month - 1 day'
          ))::int
        )
      ) as event_date
    ) dates
    where d.employment_start_date is not null
      and nullif(btrim(d.current_employer), '') is not null
      and d.share_work_events
      and dates.event_date between p_since::date and current_date
    order by d.user_id, dates.event_date desc
  ),
  job_changes as (
    select
      e.id::text as event_id,
      e.user_id,
      e.event_type,
      e.occurred_on as event_date,
      p.display_name as full_name,
      p.initials,
      p.avatar_url,
      e.role,
      e.employer as organization,
      null::int as years
    from connected c
    join public.network_events e on e.user_id = c.user_id
    join public.network_profile_details d on d.user_id = e.user_id
    join public.profiles p on p.id = e.user_id
    where e.event_type = 'job_change'
      and e.created_at >= p_since
      and d.share_work_events
  )
  select * from birthdays
  union all
  select * from anniversaries
  union all
  select * from job_changes
  order by event_date desc, full_name;
$$;

create or replace function public.record_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employer text;
begin
  if new.role is distinct from old.role and nullif(btrim(new.role), '') is not null then
    select current_employer into v_employer
    from public.network_profile_details
    where user_id = new.id;
    if nullif(btrim(v_employer), '') is not null then
      insert into public.network_events (user_id, event_type, role, employer)
      values (new.id, 'job_change', new.role, v_employer)
      on conflict (user_id, event_type, occurred_on) do update
        set role = excluded.role, employer = excluded.employer, created_at = now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_record_network_role_change on public.profiles;
create trigger profiles_record_network_role_change
  after update of role on public.profiles
  for each row execute function public.record_profile_role_change();

create or replace function public.record_network_employer_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  if new.current_employer is distinct from old.current_employer
     and nullif(btrim(new.current_employer), '') is not null then
    select role into v_role from public.profiles where id = new.user_id;
    insert into public.network_events (user_id, event_type, role, employer)
    values (new.user_id, 'job_change', coalesce(v_role, ''), new.current_employer)
    on conflict (user_id, event_type, occurred_on) do update
      set role = excluded.role, employer = excluded.employer, created_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists network_details_record_employer_change on public.network_profile_details;
create trigger network_details_record_employer_change
  after update of current_employer on public.network_profile_details
  for each row execute function public.record_network_employer_change();

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
  v_a := least(v_me, p_other_user);
  v_b := greatest(v_me, p_other_user);
  insert into public.direct_conversations (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do update set updated_at = public.direct_conversations.updated_at
  returning id into v_id;
  return v_id;
end;
$$;

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
    latest.body,
    coalesce(latest.created_at, c.created_at)
  from public.direct_conversations c
  join public.profiles p
    on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select m.body, m.created_at
    from public.direct_messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) latest on true
  where auth.uid() in (c.user_a, c.user_b)
  order by coalesce(latest.created_at, c.created_at) desc;
$$;

create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (p.scheduled_at is null or p.scheduled_at <= now())
      and (
        p.user_id = auth.uid()
        or p.audience = 'anyone'
        or (
          p.audience = 'connections'
          and exists (
            select 1 from public.connections c
            where (c.user_a = p.user_id and c.user_b = auth.uid())
               or (c.user_b = p.user_id and c.user_a = auth.uid())
          )
        )
        or (
          p.audience = 'channel'
          and p.channel_id is not null
          and exists (
            select 1 from public.channel_members cm
            where cm.channel_id = p.channel_id and cm.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.can_comment_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and public.can_view_post(p.id)
      and (
        p.comment_audience = 'anyone'
        or (
          p.comment_audience = 'connections'
          and (
            p.user_id = auth.uid()
            or exists (
              select 1 from public.connections c
              where (c.user_a = p.user_id and c.user_b = auth.uid())
                 or (c.user_b = p.user_id and c.user_a = auth.uid())
            )
          )
        )
      )
  );
$$;

revoke all on function public.send_connection_request(uuid) from public;
revoke all on function public.respond_to_connection_request(uuid, boolean) from public;
revoke all on function public.network_connection_requests() from public;
revoke all on function public.network_suggestions() from public;
revoke all on function public.network_connections() from public;
revoke all on function public.connection_status(uuid) from public;
revoke all on function public.get_network_catchup_since() from public;
revoke all on function public.mark_network_catchup_seen() from public;
revoke all on function public.network_catchup_events(timestamptz) from public;
revoke all on function public.open_direct_conversation(uuid) from public;
revoke all on function public.direct_message_inbox() from public;
grant execute on function public.send_connection_request(uuid) to authenticated;
grant execute on function public.respond_to_connection_request(uuid, boolean) to authenticated;
grant execute on function public.network_connection_requests() to authenticated;
grant execute on function public.network_suggestions() to authenticated;
grant execute on function public.network_connections() to authenticated;
grant execute on function public.connection_status(uuid) to authenticated;
grant execute on function public.get_network_catchup_since() to authenticated;
grant execute on function public.mark_network_catchup_seen() to authenticated;
grant execute on function public.network_catchup_events(timestamptz) to authenticated;
grant execute on function public.open_direct_conversation(uuid) to authenticated;
grant execute on function public.direct_message_inbox() to authenticated;

grant select on public.connections, public.connection_requests to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant select on public.direct_conversations to authenticated;
grant select, insert, update on public.network_profile_details to authenticated;
grant select, insert, update, delete on public.network_catchup_state to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.direct_messages;
exception
  when duplicate_object then null;
end;
$$;

commit;

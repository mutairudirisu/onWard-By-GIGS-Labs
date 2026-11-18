begin;

alter table public.push_jobs
  drop constraint if exists push_jobs_kind_check;

alter table public.push_jobs
  add constraint push_jobs_kind_check
  check (kind in ('checklist', 'focus', 'broadcast'));

create index if not exists push_jobs_broadcast_user_recent_idx
  on public.push_jobs (user_id, created_at desc)
  where kind = 'broadcast';

create table if not exists public.push_automations (
  id           text primary key check (
    id in ('monday_motivation', 'daily_checkin', 'friday_reflection', 'long_absence')
  ),
  title        text not null check (char_length(title) between 1 and 120),
  body         text not null check (char_length(body) between 1 and 300),
  href         text not null check (left(href, 1) = '/' and left(href, 2) <> '//'),
  trigger_type text not null check (
    trigger_type in ('monday_motivation', 'daily_checkin', 'friday_reflection', 'long_absence')
  ),
  local_time   time not null check (local_time >= time '08:00' and local_time < time '20:00'),
  enabled      boolean not null default false,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into public.push_automations (id, title, body, href, trigger_type, local_time)
values
  (
    'monday_motivation',
    'A new week, one step at a time',
    'Pick one small win to move forward today. You can log it in onWard when you are ready.',
    '/today',
    'monday_motivation',
    '08:30'
  ),
  (
    'daily_checkin',
    'One small win today?',
    'If you have made progress, take a moment to log it. Small steps count.',
    '/onwards/new',
    'daily_checkin',
    '18:00'
  ),
  (
    'friday_reflection',
    'What moved forward this week?',
    'Capture a win from this week before the weekend. Your progress deserves to be remembered.',
    '/onwards/new',
    'friday_reflection',
    '16:00'
  ),
  (
    'long_absence',
    'Your next step is still yours',
    'No rush or pressure. When you are ready, open onWard and pick up where you left off.',
    '/today',
    'long_absence',
    '11:00'
  )
on conflict (id) do nothing;

create table if not exists public.push_automation_runs (
  automation_id text not null references public.push_automations (id) on delete cascade,
  run_date      date not null,
  created_at    timestamptz not null default now(),
  primary key (automation_id, run_date)
);

create table if not exists public.push_automation_deliveries (
  automation_id text not null references public.push_automations (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  occurrence_key text not null,
  job_id        text not null unique references public.push_jobs (id) on delete cascade,
  queued_at     timestamptz not null default now(),
  primary key (automation_id, user_id, occurrence_key)
);

create index if not exists push_automation_deliveries_recent_idx
  on public.push_automation_deliveries (queued_at desc);

alter table public.push_automations enable row level security;
alter table public.push_automation_runs enable row level security;
alter table public.push_automation_deliveries enable row level security;
revoke all on public.push_automations, public.push_automation_runs, public.push_automation_deliveries
  from anon, authenticated;
grant all on public.push_automations, public.push_automation_runs, public.push_automation_deliveries
  to service_role;

create or replace function public.admin_push_automations()
returns table (
  id text,
  title text,
  body text,
  href text,
  trigger_type text,
  local_time text,
  enabled boolean,
  sent_7d bigint,
  opted_in_users bigint
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
      a.id,
      a.title,
      a.body,
      a.href,
      a.trigger_type,
      to_char(a.local_time, 'HH24:MI'),
      a.enabled,
      (
        select count(*)
        from public.push_automation_deliveries d
        join public.push_jobs j on j.id = d.job_id
        where d.automation_id = a.id
          and j.sent_at >= now() - interval '7 days'
      ),
      (
        select count(distinct ps.user_id)
        from public.push_subscriptions ps
        join public.user_settings us on us.user_id = ps.user_id
        where us.notifications is true
      )
    from public.push_automations a
    order by case a.id
      when 'monday_motivation' then 1
      when 'daily_checkin' then 2
      when 'friday_reflection' then 3
      else 4
    end;
end;
$$;

revoke all on function public.admin_push_automations() from public, anon;
grant execute on function public.admin_push_automations() to authenticated;

create or replace function public.admin_update_push_automation(
  p_id text,
  p_enabled boolean,
  p_local_time time,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not internal.is_admin() then
    raise exception 'not authorised';
  end if;
  if p_id not in ('monday_motivation', 'daily_checkin', 'friday_reflection', 'long_absence')
     or p_local_time is null
     or p_local_time < time '08:00'
     or p_local_time >= time '20:00'
     or char_length(trim(p_title)) not between 1 and 120
     or char_length(trim(p_body)) not between 1 and 300 then
    raise exception 'Invalid notification automation settings.';
  end if;

  update public.push_automations
     set enabled = p_enabled,
         local_time = p_local_time,
         title = trim(p_title),
         body = trim(p_body),
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_id;
  if not found then
    raise exception 'Notification automation not found.';
  end if;
end;
$$;

revoke all on function public.admin_update_push_automation(text, boolean, time, text, text)
  from public, anon;
grant execute on function public.admin_update_push_automation(text, boolean, time, text, text)
  to authenticated;

create or replace function public.enqueue_automated_push_jobs(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_local_now timestamp := p_now at time zone 'Africa/Lagos';
  v_today date := (p_now at time zone 'Africa/Lagos')::date;
  v_week_start date := date_trunc('week', p_now at time zone 'Africa/Lagos')::date;
  v_automation record;
  v_claimed_id text;
  v_queued integer := 0;
  v_added integer := 0;
begin
  perform pg_advisory_xact_lock(781293, 80211);

  for v_automation in
    select a.*
    from public.push_automations a
    where a.enabled
      and v_local_now::time >= time '08:00'
      and v_local_now::time < time '20:00'
      and a.local_time <= v_local_now::time
      and (
        a.trigger_type in ('daily_checkin', 'long_absence')
        or (a.trigger_type = 'monday_motivation' and extract(isodow from v_local_now) = 1)
        or (a.trigger_type = 'friday_reflection' and extract(isodow from v_local_now) = 5)
      )
    order by case a.id
      when 'long_absence' then 1
      when 'daily_checkin' then 2
      when 'friday_reflection' then 3
      else 4
    end
  loop
    insert into public.push_automation_runs (automation_id, run_date)
    values (v_automation.id, v_today)
    on conflict do nothing
    returning automation_id into v_claimed_id;

    if not found then
      continue;
    end if;

    with eligible as (
      select
        u.id as user_id,
        u.created_at,
        greatest(
          coalesce(activity.last_active, (u.created_at at time zone 'Africa/Lagos')::date),
          coalesce(
            (u.last_sign_in_at at time zone 'Africa/Lagos')::date,
            (u.created_at at time zone 'Africa/Lagos')::date
          )
        ) as last_active
      from auth.users u
      join public.user_settings us
        on us.user_id = u.id and us.notifications is true
      left join lateral (
        select max(ad.day) as last_active
        from public.activity_days ad
        where ad.user_id = u.id
          and (coalesce(ad.task_count, 0) + coalesce(ad.ward_count, 0) + coalesce(ad.note_count, 0)) > 0
      ) activity on true
      where exists (
        select 1
        from public.push_subscriptions ps
        where ps.user_id = u.id
      )
    ),
    candidates as (
      select
        e.user_id,
        case
          when v_automation.trigger_type = 'long_absence' then e.last_active::text
          else v_today::text
        end as occurrence_key
      from eligible e
      where
        case v_automation.trigger_type
          when 'monday_motivation' then
            e.last_active >= v_today - 2
          when 'daily_checkin' then
            e.last_active >= v_today - 1
            and e.created_at < p_now - interval '24 hours'
            and not exists (
              select 1 from public.activity_days ad
              where ad.user_id = e.user_id
                and ad.day = v_today
                and (coalesce(ad.task_count, 0) + coalesce(ad.ward_count, 0) + coalesce(ad.note_count, 0)) > 0
            )
          when 'friday_reflection' then
            e.last_active >= v_week_start
            and not exists (
              select 1 from public.on_wards w
              where w.user_id = e.user_id
                and coalesce(w.day, (w.created_at at time zone 'Africa/Lagos')::date) between v_week_start and v_today
            )
          when 'long_absence' then
            e.last_active <= v_today - 3
          else false
        end
        and (
          select count(*)
          from public.push_jobs j
          where j.user_id = e.user_id
            and j.kind = 'broadcast'
            and j.created_at >= p_now - interval '7 days'
        ) < 3
        and not exists (
          select 1
          from public.push_jobs j
          where j.user_id = e.user_id
            and j.kind = 'broadcast'
            and (j.created_at at time zone 'Africa/Lagos')::date = v_today
        )
        and not exists (
          select 1
          from public.push_automation_deliveries d
          where d.automation_id = v_automation.id
            and d.user_id = e.user_id
            and d.occurrence_key = case
              when v_automation.trigger_type = 'long_absence' then e.last_active::text
              else v_today::text
            end
        )
    ),
    inserted as (
      insert into public.push_jobs (
        id, user_id, kind, scheduled_at, title, body, href, data,
        attempts, claimed_until, sent_at, last_error, updated_at
      )
      select
        'auto:' || v_automation.id || ':' || c.user_id::text || ':' || c.occurrence_key,
        c.user_id,
        'broadcast',
        (v_today + v_automation.local_time) at time zone 'Africa/Lagos',
        v_automation.title,
        v_automation.body,
        v_automation.href,
        jsonb_build_object(
          'automationId', v_automation.id,
          'occurrenceKey', c.occurrence_key
        ),
        0,
        null,
        null,
        null,
        p_now
      from candidates c
      on conflict (id) do nothing
      returning id, user_id, data
    )
    insert into public.push_automation_deliveries (
      automation_id, user_id, occurrence_key, job_id
    )
    select
      inserted.data ->> 'automationId',
      inserted.user_id,
      inserted.data ->> 'occurrenceKey',
      inserted.id
    from inserted
    on conflict (automation_id, user_id, occurrence_key) do nothing;

    get diagnostics v_added = row_count;
    v_queued := v_queued + v_added;
  end loop;

  return v_queued;
end;
$$;

revoke all on function public.enqueue_automated_push_jobs(timestamptz)
  from public, anon, authenticated;
grant execute on function public.enqueue_automated_push_jobs(timestamptz) to service_role;

commit;

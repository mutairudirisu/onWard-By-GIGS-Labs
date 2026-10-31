-- onWard · real usage, referrals and the admin console
-- 1. activity_days becomes the single source for streaks, heatmaps and leaderboards
-- 2. every profile gets a shareable referral code; qualified referrals earn Pro time
-- 3. authenticated RPCs for the leaderboard and referrals, admin-only RPCs for the console

begin;

-- ------------------------------------------------------------------ activity
alter table public.activity_days
  add column if not exists note_count integer not null default 0;

create or replace function internal.recompute_streak(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current integer := 0;
  v_longest integer := 0;
  v_days    integer := 0;
  v_cursor  date;
begin
  select count(*) into v_days
  from public.activity_days
  where user_id = p_user;

  -- longest run: consecutive days share (day - row_number)
  select coalesce(max(len), 0) into v_longest
  from (
    select count(*) as len
    from (
      select day, day - (row_number() over (order by day))::int as grp
      from (select distinct day from public.activity_days where user_id = p_user) d
    ) islands
    group by grp
  ) runs;

  -- current run: walk back from today, or yesterday before the day is logged
  if exists (select 1 from public.activity_days where user_id = p_user and day = current_date) then
    v_cursor := current_date;
  elsif exists (select 1 from public.activity_days where user_id = p_user and day = current_date - 1) then
    v_cursor := current_date - 1;
  else
    v_cursor := null;
  end if;

  while v_cursor is not null loop
    exit when not exists (
      select 1 from public.activity_days where user_id = p_user and day = v_cursor
    );
    v_current := v_current + 1;
    v_cursor := v_cursor - 1;
  end loop;

  insert into public.streaks (user_id, current, longest, days_using)
  values (p_user, v_current, v_longest, v_days)
  on conflict (user_id) do update
    set current = excluded.current,
        longest = greatest(public.streaks.longest, excluded.longest),
        days_using = excluded.days_using,
        updated_at = now();
end;
$$;

-- Backfill activity from the rows users already have, then rebuild streaks once.
insert into public.activity_days (user_id, day, ward_count)
select user_id, coalesce(day, created_at::date), count(*)
from public.on_wards
group by user_id, coalesce(day, created_at::date)
on conflict (user_id, day) do update
  set ward_count = excluded.ward_count;

insert into public.activity_days (user_id, day, task_count)
select user_id, created_at::date, count(*)
from public.tasks
group by user_id, created_at::date
on conflict (user_id, day) do update
  set task_count = excluded.task_count;

insert into public.activity_days (user_id, day, note_count)
select user_id, created_at::date, count(*)
from public.notes
group by user_id, created_at::date
on conflict (user_id, day) do update
  set note_count = excluded.note_count;

select internal.recompute_streak(id) from public.profiles;

create or replace function internal.activity_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform internal.recompute_streak(new.user_id);
  return new;
end;
$$;

drop trigger if exists activity_recompute_streak on public.activity_days;
create trigger activity_recompute_streak
  after insert or update on public.activity_days
  for each row execute function internal.activity_changed();

create or replace function public.record_activity(p_kind text, p_day date default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_day date;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in ('task', 'ward', 'note') then
    raise exception 'unknown activity kind';
  end if;

  -- clamp to the user's plausible local today so a skewed device clock cannot
  -- invent future streaks
  v_day := least(greatest(coalesce(p_day, current_date), current_date - 1), current_date);

  insert into public.activity_days (user_id, day, task_count, ward_count, note_count)
  values (
    v_uid,
    v_day,
    case when p_kind = 'task' then 1 else 0 end,
    case when p_kind = 'ward' then 1 else 0 end,
    case when p_kind = 'note' then 1 else 0 end
  )
  on conflict (user_id, day) do update
    set task_count = public.activity_days.task_count + excluded.task_count,
        ward_count = public.activity_days.ward_count + excluded.ward_count,
        note_count = public.activity_days.note_count + excluded.note_count,
        updated_at = now();
end;
$$;

revoke all on function public.record_activity(text, date) from public, anon;
grant execute on function public.record_activity(text, date) to authenticated;

revoke all on function internal.recompute_streak(uuid) from public, anon, authenticated;
revoke all on function internal.activity_changed() from public, anon, authenticated;

-- ----------------------------------------------------------------- referrals
create or replace function internal.gen_referral_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(
        v_alphabet,
        1 + floor(random() * length(v_alphabet))::int,
        1
      );
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null,
  add column if not exists referral_credits integer not null default 0,
  add column if not exists pro_until timestamptz;

update public.profiles
set referral_code = internal.gen_referral_code()
where referral_code is null;

alter table public.profiles alter column referral_code set not null;
drop index if exists profiles_referral_code_key;
create unique index profiles_referral_code_key on public.profiles (referral_code);

create or replace function internal.assign_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.referral_code is null then
    new.referral_code := internal.gen_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists assign_referral_code on public.profiles;
create trigger assign_referral_code
  before insert on public.profiles
  for each row execute function internal.assign_referral_code();

create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.profiles (id) on delete cascade,
  referee_id   uuid not null unique references public.profiles (id) on delete cascade,
  code         text not null,
  status       text not null default 'joined' check (status in ('joined', 'qualified')),
  qualified_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

drop policy if exists "referral participants read" on public.referrals;
create policy "referral participants read" on public.referrals
  for select to authenticated
  using ((select auth.uid()) = referrer_id or (select auth.uid()) = referee_id);

revoke all on public.referrals from anon;
grant select on public.referrals to authenticated;

create or replace function public.redeem_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_ref   uuid;
  v_age   interval;
begin
  if v_uid is null then
    return false;
  end if;

  select id into v_ref
  from public.profiles
  where upper(referral_code) = upper(btrim(p_code));

  if v_ref is null or v_ref = v_uid then
    return false;
  end if;

  select now() - created_at into v_age from public.profiles where id = v_uid;
  if v_age is null or v_age > interval '14 days' then
    return false;
  end if;

  if exists (select 1 from public.referrals where referee_id = v_uid) then
    return false;
  end if;

  insert into public.referrals (referrer_id, referee_id, code)
  values (v_ref, v_uid, upper(btrim(p_code)));

  update public.profiles set referred_by = v_ref where id = v_uid;
  return true;
exception
  when unique_violation then
    return false;
end;
$$;

revoke all on function public.redeem_referral(text) from public, anon;
grant execute on function public.redeem_referral(text) to authenticated;

-- A referral qualifies once the friend logs their first onWard.
create or replace function internal.qualify_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ref_id   uuid;
  v_referrer uuid;
  v_credits  integer;
begin
  select id, referrer_id into v_ref_id, v_referrer
  from public.referrals
  where referee_id = new.user_id and status = 'joined'
  limit 1;

  if v_ref_id is null then
    return new;
  end if;

  update public.referrals
  set status = 'qualified', qualified_at = now()
  where id = v_ref_id;

  update public.profiles
  set referral_credits = referral_credits + 1
  where id = v_referrer
  returning referral_credits into v_credits;

  -- three qualified friends = one month of Pro
  if v_credits >= 3 then
    update public.profiles
    set referral_credits = referral_credits - 3,
        plan = 'pro',
        pro_until = greatest(coalesce(pro_until, now()), now()) + interval '30 days'
    where id = v_referrer;
  end if;

  return new;
end;
$$;

drop trigger if exists on_ward_qualifies_referral on public.on_wards;
create trigger on_ward_qualifies_referral
  after insert on public.on_wards
  for each row execute function internal.qualify_referral();

revoke all on function internal.qualify_referral() from public, anon, authenticated;

create or replace function public.my_referrals()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'code', p.referral_code,
    'credits', p.referral_credits,
    'pro_until', p.pro_until,
    'referrals', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', rp.display_name,
          'initials', rp.initials,
          'status', r.status,
          'joined', r.created_at
        ) order by r.created_at desc
      )
      from public.referrals r
      join public.profiles rp on rp.id = r.referee_id
      where r.referrer_id = v_uid
    ), '[]'::jsonb)
  ) into v_out
  from public.profiles p
  where p.id = v_uid;

  return v_out;
end;
$$;

revoke all on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

insert into public.referrals (referrer_id, referee_id, code, status, qualified_at)
select p.referred_by, p.id, ref.referral_code, 'qualified', p.created_at
from public.profiles p
join public.profiles ref on ref.id = p.referred_by
where p.referred_by is not null
on conflict (referee_id) do nothing;

-- --------------------------------------------------------------- leaderboard
create or replace function public.leaderboard(p_period text default 'month')
returns table (
  place        bigint,
  user_id      uuid,
  display_name text,
  initials     text,
  streak       integer,
  on_wards     bigint
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  with bounds as (
    select case p_period
      when 'week' then date_trunc('week', current_date)::date
      when 'all' then date '1970-01-01'
      else date_trunc('month', current_date)::date
    end as since
  ),
  scores as (
    select
      p.id,
      p.display_name,
      coalesce(
        nullif(btrim(upper(p.initials)), ''),
        upper(left(btrim(p.display_name), 1))
      ) as initials,
      coalesce(s.current, 0)::int as streak,
      (
        select count(*)
        from public.on_wards w, bounds b
        where w.user_id = p.id
          and coalesce(w.day, w.created_at::date) >= b.since
      ) as on_wards
    from public.profiles p
    left join public.streaks s on s.user_id = p.id
    where coalesce(btrim(p.display_name), '') <> ''
  )
  select
    row_number() over (order by on_wards desc, streak desc, display_name) as place,
    id, display_name, initials, streak, on_wards
  from scores
  order by 1
  limit 50;
$$;

revoke all on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

-- -------------------------------------------------------------------- admin
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function internal.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function internal.is_admin() from public, anon, authenticated;

-- the platform owner who bootstrapped this project
insert into public.admins (user_id)
values ('3553cc39-3850-45b2-898c-e17a59d82c87')
on conflict (user_id) do nothing;

create or replace function public.admin_me()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select internal.is_admin();
$$;

revoke all on function public.admin_me() from public, anon;
grant execute on function public.admin_me() to authenticated;

create or replace function public.admin_users()
returns table (
  id              uuid,
  email           text,
  display_name    text,
  role            text,
  plan            text,
  signed_up       timestamptz,
  last_sign_in    timestamptz,
  streak          integer,
  longest         integer,
  on_wards        bigint,
  tasks           bigint,
  notes           bigint,
  active_days     bigint,
  last_day        date,
  referral_code   text,
  referral_credits integer,
  pro_until       timestamptz
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
      u.id,
      u.email::text,
      coalesce(p.display_name, ''),
      coalesce(p.role, ''),
      coalesce(p.plan, 'free'),
      u.created_at,
      u.last_sign_in_at,
      coalesce(s.current, 0),
      coalesce(s.longest, 0),
      (select count(*) from public.on_wards w where w.user_id = u.id),
      (select count(*) from public.tasks t where t.user_id = u.id),
      (select count(*) from public.notes n where n.user_id = u.id),
      (select count(*) from public.activity_days a where a.user_id = u.id),
      (select max(a.day) from public.activity_days a where a.user_id = u.id),
      p.referral_code,
      coalesce(p.referral_credits, 0),
      p.pro_until
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.streaks s on s.user_id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

create or replace function public.admin_overview()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_out jsonb;
begin
  if not internal.is_admin() then
    raise exception 'not authorised';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from auth.users),
    'active_7d', (
      select count(distinct user_id) from public.activity_days
      where day >= current_date - 6
    ),
    'new_7d', (
      select count(*) from auth.users where created_at >= current_date - 6
    ),
    'paid', (
      select count(*) from public.profiles
      where plan = 'pro' or coalesce(pro_until, now()) > now()
    ),
    'on_wards', (select count(*) from public.on_wards),
    'tasks', (select count(*) from public.tasks),
    'notes', (select count(*) from public.notes),
    'dau', coalesce((
      select jsonb_agg(
        jsonb_build_object('day', d::text, 'value', coalesce(x.c, 0)) order by d
      )
      from generate_series(current_date - 6, current_date, '1 day') d
      left join (
        select day, count(distinct user_id) as c
        from public.activity_days
        where day >= current_date - 6
        group by day
      ) x on x.day = d
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', coalesce(p.display_name, 'Someone'),
          'title', w.title,
          'when', w.created_at
        ) order by w.created_at desc
      )
      from (
        select * from public.on_wards order by created_at desc limit 6
      ) w
      left join public.profiles p on p.id = w.user_id
    ), '[]'::jsonb)
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

commit;

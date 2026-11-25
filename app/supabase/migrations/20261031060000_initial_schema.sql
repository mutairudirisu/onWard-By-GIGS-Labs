-- onWard backend schema — mirrors Onward/app/lib/data.ts
-- Conventions: RLS on every public table, ownership predicate on every policy,
-- UPDATE policies carry both USING and WITH CHECK, auth.uid() is wrapped.

begin;

-- ---------------------------------------------------------------- helpers
create schema if not exists internal;
alter schema internal owner to postgres;
-- never exposed through the Data API
revoke all on schema internal from public, anon, authenticated;
grant usage on schema internal to postgres, service_role;

create or replace function internal.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  initials     text,
  role         text,
  location     text,
  bio          text,
  avatar_url   text,
  plan         text not null default 'free' check (plan in ('free', 'pro')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------- tasks
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  meta        text not null default '',
  notes       text,
  time        text,
  day         date,
  due_date    date,
  list        text,
  priority    text,
  done        boolean not null default false,
  archived    boolean not null default false,
  reminder_at timestamptz,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_user_day_idx on public.tasks (user_id, day);
create index if not exists tasks_user_created_idx on public.tasks (user_id, created_at desc);

-- ------------------------------------------------------------------- notes
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default 'Untitled note',
  excerpt    text not null default '',
  body       text not null default '',
  tag        text,
  priority   text,
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);

-- ------------------------------------------------------------------ skills
create table if not exists public.skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------------------------------------------------------------- on_wards
create table if not exists public.on_wards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  impact       text not null default '',
  body         text,
  project      text,
  day          date,
  in_portfolio boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists on_wards_user_day_idx on public.on_wards (user_id, day desc);

-- ward <-> skill join. user_id is denormalised so RLS stays a single-column check.
create table if not exists public.ward_skills (
  ward_id   uuid not null references public.on_wards (id) on delete cascade,
  skill_id  uuid not null references public.skills (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ward_id, skill_id)
);
create index if not exists ward_skills_user_idx on public.ward_skills (user_id);

-- ---------------------------------------------------------------- evidence
create table if not exists public.evidence (
  id           uuid primary key default gen_random_uuid(),
  ward_id      uuid not null references public.on_wards (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('file', 'url', 'image')),
  label        text not null,
  meta         text,
  url          text,
  storage_path text,
  created_at   timestamptz not null default now()
);
create index if not exists evidence_ward_idx on public.evidence (ward_id);
create index if not exists evidence_user_idx on public.evidence (user_id);

-- -------------------------------------------------------------- activity
-- Real source for the heatmap, streaks and leaderboard (replaces seeded data).
create table if not exists public.activity_days (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  task_count integer not null default 0,
  ward_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.streaks (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  current    integer not null default 0,
  longest    integer not null default 0,
  days_using integer not null default 0,
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------- settings
create table if not exists public.user_settings (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  theme                 text not null default 'light' check (theme in ('light', 'dark')),
  notifications         boolean not null default true,
  weekly_digest         boolean not null default false,
  haptics               boolean not null default true,
  reduced_motion        boolean not null default false,
  default_reminder_time text not null default '09:00',
  updated_at            timestamptz not null default now()
);

-- --------------------------------------------------------------- sharing
create table if not exists public.portfolio_shares (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  slug       text not null unique,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_shares_user_idx on public.portfolio_shares (user_id);

-- ------------------------------------------------------- updated_at hooks
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'tasks', 'notes', 'on_wards', 'activity_days', 'streaks', 'user_settings']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I',
      t
    );
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function internal.set_updated_at()',
      t
    );
  end loop;
end
$$;

-- --------------------------------------------------------------- row level
alter table public.profiles          enable row level security;
alter table public.tasks             enable row level security;
alter table public.notes             enable row level security;
alter table public.skills            enable row level security;
alter table public.on_wards          enable row level security;
alter table public.ward_skills       enable row level security;
alter table public.evidence          enable row level security;
alter table public.activity_days     enable row level security;
alter table public.streaks           enable row level security;
alter table public.user_settings     enable row level security;
alter table public.portfolio_shares  enable row level security;

-- Owner-scoped policies for every user-owned table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'tasks', 'notes', 'skills', 'on_wards',
    'ward_skills', 'evidence', 'activity_days', 'streaks',
    'user_settings', 'portfolio_shares'
  ]
  loop
    -- profiles keys on "id", every other table on "user_id"
    if t = 'profiles' then
      execute format('drop policy if exists "owner select" on public.%I', t);
      execute format('create policy "owner select" on public.%I for select to authenticated using ((select auth.uid()) = id)', t);
      execute format('drop policy if exists "owner insert" on public.%I', t);
      execute format('create policy "owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = id)', t);
      execute format('drop policy if exists "owner update" on public.%I', t);
      execute format('create policy "owner update" on public.%I for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)', t);
      execute format('drop policy if exists "owner delete" on public.%I', t);
      execute format('create policy "owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = id)', t);
    else
      execute format('drop policy if exists "owner select" on public.%I', t);
      execute format('create policy "owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
      execute format('drop policy if exists "owner insert" on public.%I', t);
      execute format('create policy "owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
      execute format('drop policy if exists "owner update" on public.%I', t);
      execute format('create policy "owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
      execute format('drop policy if exists "owner delete" on public.%I', t);
      execute format('create policy "owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    end if;
  end loop;
end
$$;

-- Public read for a shared portfolio without leaking anything else.
drop policy if exists "public portfolio read" on public.profiles;
create policy "public portfolio read" on public.profiles
  for select to anon
  using (
    exists (
      select 1 from public.portfolio_shares ps
      where ps.user_id = profiles.id and ps.is_public
    )
  );

-- plan is billing state: a user may never write it from the client.
revoke update on public.profiles from authenticated;
grant update (display_name, initials, role, location, bio, avatar_url) on public.profiles to authenticated;

commit;

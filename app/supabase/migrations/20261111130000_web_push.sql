begin;

create table if not exists public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  endpoint        text not null unique,
  subscription    jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

create table if not exists public.push_jobs (
  id              text primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  kind            text not null check (kind in ('checklist', 'focus')),
  scheduled_at    timestamptz not null,
  title           text not null,
  body            text not null,
  href            text not null,
  data            jsonb not null default '{}'::jsonb,
  attempts        integer not null default 0,
  claimed_until   timestamptz,
  sent_at         timestamptz,
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists push_jobs_due_idx
  on public.push_jobs (scheduled_at)
  where sent_at is null;

alter table public.push_subscriptions enable row level security;
alter table public.push_jobs enable row level security;
revoke all on public.push_subscriptions, public.push_jobs from anon, authenticated;
grant all on public.push_subscriptions, public.push_jobs to service_role;

create or replace function public.claim_due_push_jobs(p_limit integer default 100)
returns setof public.push_jobs
language sql
security definer
set search_path = public
as $$
  with due as (
    select id
      from public.push_jobs
     where sent_at is null
       and scheduled_at <= now()
       and attempts < 5
       and (claimed_until is null or claimed_until < now())
     order by scheduled_at
     for update skip locked
     limit greatest(1, least(p_limit, 500))
  )
  update public.push_jobs as jobs
     set claimed_until = now() + interval '5 minutes',
         attempts = jobs.attempts + 1,
         updated_at = now()
    from due
   where jobs.id = due.id
  returning jobs.*;
$$;

revoke all on function public.claim_due_push_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_due_push_jobs(integer) to service_role;

commit;

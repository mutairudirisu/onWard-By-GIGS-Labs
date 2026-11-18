begin;

alter table public.profiles
  add column if not exists evidence_wards_used integer not null default 0
  check (evidence_wards_used >= 0);

create table if not exists public.ward_evidence_entitlements (
  user_id    uuid not null references auth.users (id) on delete cascade,
  ward_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ward_id)
);

alter table public.ward_evidence_entitlements enable row level security;
revoke all on public.ward_evidence_entitlements from anon, authenticated;
grant select on public.ward_evidence_entitlements to authenticated;

drop policy if exists "ward evidence entitlements owner read"
  on public.ward_evidence_entitlements;
create policy "ward evidence entitlements owner read"
  on public.ward_evidence_entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

insert into public.ward_evidence_entitlements (user_id, ward_id)
select distinct user_id, ward_id
  from public.evidence
on conflict (user_id, ward_id) do nothing;

update public.profiles as p
   set evidence_wards_used = (
     select count(*)
       from public.ward_evidence_entitlements as entitlement
      where entitlement.user_id = p.id
   );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ward-evidence',
  'ward-evidence',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ward evidence owner read" on storage.objects;
create policy "ward evidence owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ward-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "ward evidence owner insert" on storage.objects;
create policy "ward evidence owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ward-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "ward evidence owner delete" on storage.objects;
create policy "ward evidence owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'ward-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function public.enforce_free_ward_evidence_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  ward_owner uuid;
  owner_plan text;
  owner_pro_until timestamptz;
  evidence_wards_used integer;
  entitlement_inserted integer;
begin
  select w.user_id
    into ward_owner
    from public.on_wards as w
   where w.id = new.ward_id;

  if ward_owner is null or ward_owner <> new.user_id then
    raise exception 'Evidence must belong to one of your onWards.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(ward_owner::text)::bigint);

  if exists (
    select 1
      from public.ward_evidence_entitlements
     where user_id = ward_owner
       and ward_id = new.ward_id
  ) then
    return new;
  end if;

  select p.plan, p.pro_until
       , p.evidence_wards_used
    into owner_plan, owner_pro_until, evidence_wards_used
    from public.profiles as p
   where p.id = ward_owner;

  if coalesce(owner_plan, 'free') <> 'pro'
     and (owner_pro_until is null or owner_pro_until <= now())
     and coalesce(evidence_wards_used, 0) >= 3 then
    raise exception 'Free accounts can attach evidence to up to 3 onWards. Upgrade to Pro for unlimited attachments.'
      using errcode = 'P0001';
  end if;

  insert into public.ward_evidence_entitlements (user_id, ward_id)
  values (ward_owner, new.ward_id)
  on conflict (user_id, ward_id) do nothing;
  get diagnostics entitlement_inserted = row_count;

  if entitlement_inserted = 1 then
    update public.profiles as profile
       set evidence_wards_used = profile.evidence_wards_used + 1
     where profile.id = ward_owner;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_ward_evidence_limit on public.evidence;
create trigger enforce_free_ward_evidence_limit
  before insert or update of ward_id, user_id on public.evidence
  for each row execute function public.enforce_free_ward_evidence_limit();

revoke all on function public.enforce_free_ward_evidence_limit() from public, anon, authenticated;

commit;

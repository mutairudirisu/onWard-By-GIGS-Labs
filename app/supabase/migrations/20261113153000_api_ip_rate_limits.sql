begin;

create table if not exists public.api_ip_rate_limits (
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  action text not null check (
    action in ('proofread', 'transcribe', 'push_subscriptions', 'push_schedules', 'cron_push')
  ),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (ip_hash, action)
);

create index if not exists api_ip_rate_limits_window_idx
  on public.api_ip_rate_limits (window_started_at);

alter table public.api_ip_rate_limits enable row level security;
revoke all on table public.api_ip_rate_limits from public, anon, authenticated;

create or replace function public.consume_ip_api_rate_limit(
  p_ip_hash text,
  p_action text
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_limit integer;
  v_window_started_at timestamptz;
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid client identifier' using errcode = '22023';
  end if;

  case p_action
    when 'proofread' then v_limit := 30;
    when 'transcribe' then v_limit := 20;
    when 'push_subscriptions' then v_limit := 60;
    when 'push_schedules' then v_limit := 60;
    when 'cron_push' then v_limit := 10;
    else raise exception 'Unsupported API action' using errcode = '22023';
  end case;

  if mod(floor(extract(epoch from v_now))::bigint, 60) = 0
     and pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtext('api_ip_rate_limits_cleanup')) then
    delete from public.api_ip_rate_limits
     where window_started_at < v_now - interval '1 day';
  end if;

  insert into public.api_ip_rate_limits as rate_limit (
    ip_hash, action, window_started_at, request_count
  )
  values (p_ip_hash, p_action, v_now, 1)
  on conflict (ip_hash, action) do update
  set
    window_started_at = case
      when rate_limit.window_started_at <= v_now - interval '1 minute' then v_now
      else rate_limit.window_started_at
    end,
    request_count = case
      when rate_limit.window_started_at <= v_now - interval '1 minute' then 1
      else rate_limit.request_count + 1
    end
  returning window_started_at, request_count
  into v_window_started_at, v_request_count;

  return query
  select
    v_request_count <= v_limit,
    greatest(
      1,
      ceil(extract(epoch from (v_window_started_at + interval '1 minute' - v_now)))::integer
    );
end;
$function$;

alter function public.consume_ip_api_rate_limit(text, text) owner to postgres;
revoke all on function public.consume_ip_api_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_ip_api_rate_limit(text, text) to service_role;

commit;

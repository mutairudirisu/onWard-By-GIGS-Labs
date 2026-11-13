begin;

create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (
    action in ('proofread', 'transcribe', 'push_subscriptions', 'push_schedules')
  ),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, action)
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_user_api_rate_limit(p_action text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_window_started_at timestamptz;
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  case p_action
    when 'proofread' then v_limit := 10;
    when 'transcribe' then v_limit := 6;
    when 'push_subscriptions' then v_limit := 30;
    when 'push_schedules' then v_limit := 30;
    else raise exception 'Unsupported API action' using errcode = '22023';
  end case;

  insert into public.api_rate_limits as rate_limit (
    user_id, action, window_started_at, request_count
  )
  values (v_user_id, p_action, v_now, 1)
  on conflict (user_id, action) do update
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

alter function public.consume_user_api_rate_limit(text) owner to postgres;
revoke all on function public.consume_user_api_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_user_api_rate_limit(text) to authenticated;

commit;

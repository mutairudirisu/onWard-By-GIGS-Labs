begin;

create or replace function public.admin_feedback()
returns table (
  id           uuid,
  created_at   timestamptz,
  answer       text,
  body         text,
  screen       text,
  display_name text,
  email        text,
  role         text,
  plan         text
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
    p.display_name::text,
    u.email::text,
    p.role::text,
    p.plan::text
  from public.feedback f
  left join public.profiles p on p.id = f.user_id
  left join auth.users u on u.id = f.user_id
  order by f.created_at desc;
end;
$$;

revoke all on function public.admin_feedback() from public, anon;
grant execute on function public.admin_feedback() to authenticated;

commit;

begin;

create or replace function public.enable_public_portfolio_share()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_share public.portfolio_shares%rowtype;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  select *
  into v_share
  from public.portfolio_shares
  where user_id = v_user_id and is_public
  order by created_at desc
  limit 1
  for update;

  if found then
    update public.portfolio_shares
    set is_public = false
    where user_id = v_user_id and is_public and id <> v_share.id;
    return v_share.slug;
  end if;

  select *
  into v_share
  from public.portfolio_shares
  where user_id = v_user_id
  order by created_at desc
  limit 1
  for update;

  if found then
    update public.portfolio_shares
    set is_public = true
    where id = v_share.id;
    return v_share.slug;
  end if;

  loop
    v_slug := pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '');
    begin
      insert into public.portfolio_shares (user_id, slug, is_public)
      values (v_user_id, v_slug, true);
      return v_slug;
    exception
      when unique_violation then
        null;
    end;
  end loop;
end;
$$;

create or replace function public.disable_public_portfolio_share()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.portfolio_shares
  set is_public = false
  where user_id = v_user_id and is_public;
end;
$$;

create or replace function public.get_public_portfolio(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'user', pg_catalog.jsonb_build_object(
      'name', p.display_name,
      'initials', coalesce(p.initials, ''),
      'role', p.role,
      'location', p.location,
      'bio', p.bio
    ),
    'onWards', coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', w.id,
            'title', w.title,
            'impact', w.impact,
            'body', w.body,
            'project', w.project,
            'day', w.day,
            'skills', coalesce(
              (
                select pg_catalog.jsonb_agg(s.name order by s.name)
                from public.ward_skills ws
                join public.skills s on s.id = ws.skill_id and s.user_id = w.user_id
                where ws.ward_id = w.id and ws.user_id = w.user_id
              ),
              '[]'::jsonb
            ),
            'files', (
              select count(*)::int
              from public.evidence e
              where e.ward_id = w.id and e.user_id = w.user_id
            ),
            'inPortfolio', true
          )
          order by w.day desc nulls last, w.created_at desc
        )
        from public.on_wards w
        where w.user_id = ps.user_id
      ),
      '[]'::jsonb
    ),
    'skills', coalesce(
      (
        select pg_catalog.jsonb_agg(s.name order by s.created_at)
        from public.skills s
        where s.user_id = ps.user_id
      ),
      '[]'::jsonb
    ),
    'activeDays', (
      select count(*)::int
      from public.activity_days ad
      where ad.user_id = ps.user_id
    ),
    'streak', coalesce(
      (
        select pg_catalog.jsonb_build_object(
          'current', st.current,
          'longest', st.longest,
          'daysUsing', st.days_using
        )
        from public.streaks st
        where st.user_id = ps.user_id
      ),
      pg_catalog.jsonb_build_object('current', 0, 'longest', 0, 'daysUsing', 0)
    )
  )
  from public.portfolio_shares ps
  join public.profiles p on p.id = ps.user_id
  where ps.slug = p_slug and ps.is_public
  limit 1
$$;

revoke all on function public.enable_public_portfolio_share() from public, anon, authenticated;
revoke all on function public.disable_public_portfolio_share() from public, anon, authenticated;
revoke all on function public.get_public_portfolio(text) from public, anon, authenticated;

grant execute on function public.enable_public_portfolio_share() to authenticated;
grant execute on function public.disable_public_portfolio_share() to authenticated;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;

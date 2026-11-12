begin;

alter table public.communities
  add column community_type text not null default 'public'
    check (community_type in ('public', 'restricted', 'private')),
  add column is_mature boolean not null default false;

drop function public.create_community(text, text, text, text, text);

create function public.create_community(
  p_name text,
  p_slug text,
  p_topic text,
  p_description text,
  p_idea text,
  p_community_type text,
  p_is_mature boolean
)
returns table (id uuid, slug text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_community_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to create a community.';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 3 and 40 then
    raise exception 'Community names must be 3 to 40 characters.';
  end if;
  if coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Choose a community name that can be used in a link.';
  end if;
  if p_topic not in (
    'Technology',
    'Business',
    'Education & Career',
    'Wellness',
    'Arts & Design',
    'Food & Drink',
    'Sports',
    'Travel',
    'Lifestyle',
    'Other'
  ) then
    raise exception 'Choose one of the available community topics.';
  end if;
  if char_length(trim(coalesce(p_description, ''))) not between 15 and 500 then
    raise exception 'Descriptions must be 15 to 500 characters.';
  end if;
  if char_length(trim(coalesce(p_idea, ''))) not between 15 and 1000 then
    raise exception 'Community ideas must be 15 to 1000 characters.';
  end if;
  if coalesce(p_community_type, '') not in ('public', 'restricted', 'private') then
    raise exception 'Choose a valid community type.';
  end if;
  if p_is_mature is null then
    raise exception 'Choose whether this community is for adults 18 and over.';
  end if;

  insert into public.communities (
    name,
    slug,
    topic,
    description,
    created_by,
    community_type,
    is_mature
  )
  values (
    trim(p_name),
    p_slug,
    p_topic,
    trim(p_description),
    v_user_id,
    p_community_type,
    p_is_mature
  )
  returning communities.id into v_community_id;

  insert into public.community_ideas (community_id, user_id, idea)
  values (v_community_id, v_user_id, trim(p_idea));

  return query select v_community_id, p_slug;
end;
$$;

revoke all on function public.create_community(text, text, text, text, text, text, boolean) from public;
grant execute on function public.create_community(text, text, text, text, text, text, boolean) to authenticated;

create or replace view public.community_directory
with (security_barrier = true)
as
select
  c.id,
  c.slug,
  c.name,
  c.topic,
  c.description,
  c.created_at,
  coalesce(m.member_count, 0)::int as member_count,
  coalesce(p.post_count, 0)::int as post_count,
  exists (
    select 1 from public.community_members mine
    where mine.community_id = c.id and mine.user_id = auth.uid()
  ) as is_member,
  c.created_by = auth.uid() as is_owner,
  c.community_type,
  c.is_mature
from public.communities c
left join lateral (
  select count(*) as member_count
  from public.community_members cm
  where cm.community_id = c.id
) m on true
left join lateral (
  select count(*) as post_count
  from public.community_posts cp
  where cp.community_id = c.id
) p on true;

grant select on public.community_directory to anon, authenticated;

commit;

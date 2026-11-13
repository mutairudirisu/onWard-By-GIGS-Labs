begin;

create table public.community_topics (
  name text primary key check (char_length(btrim(name)) between 2 and 50),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.community_topics (name, slug)
select distinct
  topic,
  trim(both '-' from regexp_replace(lower(replace(topic, '&', 'and')), '[^a-z0-9]+', '-', 'g'))
from public.community_subcategories
on conflict do nothing;

alter table public.community_subcategories
  add column slug text;

update public.community_subcategories
set slug = trim(both '-' from regexp_replace(lower(replace(name, '&', 'and')), '[^a-z0-9]+', '-', 'g'));

alter table public.community_subcategories
  alter column slug set not null,
  drop constraint if exists community_subcategories_topic_check,
  add constraint community_subcategories_topic_fkey
    foreign key (topic)
    references public.community_topics (name);

alter table public.communities
  drop constraint if exists communities_topic_check;

create unique index community_subcategories_topic_slug_uidx
  on public.community_subcategories (topic, slug);

alter table public.community_topics enable row level security;

create policy "community topics are public"
  on public.community_topics for select to anon, authenticated
  using (true);

grant select on public.community_topics to anon, authenticated;

create function public.add_community_topic(p_name text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '[[:space:]]+', ' ', 'g');
  v_slug text;
  v_existing text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to add a topic.';
  end if;
  if char_length(v_name) not between 2 and 50 then
    raise exception 'Topics must be 2 to 50 characters long.';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(replace(v_name, '&', 'and')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then
    raise exception 'Use at least one letter or number in the topic.';
  end if;

  select name into v_existing
  from public.community_topics
  where slug = v_slug;

  if v_existing is not null and lower(v_existing) <> lower(v_name) then
    raise exception 'A topic with a similar link already exists. Choose the existing topic instead.';
  end if;

  insert into public.community_topics (name, slug, created_by)
  values (coalesce(v_existing, v_name), v_slug, auth.uid())
  on conflict do nothing;

  select name into v_existing
  from public.community_topics
  where slug = v_slug;

  if v_existing is null then
    raise exception 'Could not add that topic. Please try again.';
  end if;

  insert into public.community_subcategories (topic, name, slug)
  values (v_existing, 'General', 'general')
  on conflict do nothing;

  return v_existing;
end;
$$;

create function public.add_community_subcategory(p_topic text, p_name text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_topic text;
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '[[:space:]]+', ' ', 'g');
  v_slug text;
  v_existing text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to add a subcategory.';
  end if;
  if char_length(v_name) not between 3 and 50 then
    raise exception 'Subcategories must be 3 to 50 characters long.';
  end if;

  select name into v_topic
  from public.community_topics
  where name = trim(coalesce(p_topic, ''));

  if v_topic is null then
    raise exception 'Choose an existing topic first.';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(replace(v_name, '&', 'and')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then
    raise exception 'Use at least one letter or number in the subcategory.';
  end if;

  select name into v_existing
  from public.community_subcategories
  where topic = v_topic and slug = v_slug;

  if v_existing is not null and lower(v_existing) <> lower(v_name) then
    raise exception 'A subcategory with a similar link already exists in this topic.';
  end if;

  insert into public.community_subcategories (topic, name, slug)
  values (v_topic, coalesce(v_existing, v_name), v_slug)
  on conflict do nothing;

  select name into v_existing
  from public.community_subcategories
  where topic = v_topic and slug = v_slug;

  if v_existing is null then
    raise exception 'Could not add that subcategory. Please try again.';
  end if;

  return v_existing;
end;
$$;

revoke all on function public.add_community_topic(text) from public, anon;
revoke all on function public.add_community_subcategory(text, text) from public, anon;
grant execute on function public.add_community_topic(text) to authenticated;
grant execute on function public.add_community_subcategory(text, text) to authenticated;

create or replace function public.create_community(
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
  if not exists (
    select 1 from public.community_topics where name = trim(coalesce(p_topic, ''))
  ) then
    raise exception 'Choose an available community topic.';
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
    trim(p_topic),
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

commit;

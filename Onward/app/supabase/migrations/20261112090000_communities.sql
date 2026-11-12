begin;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 40),
  topic text not null check (
    topic in (
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
    )
  ),
  description text not null check (char_length(description) between 15 and 500),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index communities_topic_created_idx on public.communities (topic, created_at desc);

create table public.community_ideas (
  community_id uuid primary key references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  idea text not null check (char_length(idea) between 15 and 1000),
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index community_members_user_idx on public.community_members (user_id, joined_at desc);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index community_posts_created_idx on public.community_posts (community_id, created_at desc);

create function public.community_add_creator()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.community_members (community_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

revoke all on function public.community_add_creator() from public;

create trigger community_creator_membership
after insert on public.communities
for each row execute function public.community_add_creator();

create function public.create_community(
  p_name text,
  p_slug text,
  p_topic text,
  p_description text,
  p_idea text
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

  insert into public.communities (name, slug, topic, description, created_by)
  values (trim(p_name), p_slug, p_topic, trim(p_description), v_user_id)
  returning communities.id into v_community_id;

  insert into public.community_ideas (community_id, user_id, idea)
  values (v_community_id, v_user_id, trim(p_idea));

  return query select v_community_id, p_slug;
end;
$$;

revoke all on function public.create_community(text, text, text, text, text) from public;
grant execute on function public.create_community(text, text, text, text, text) to authenticated;

alter table public.communities enable row level security;
alter table public.community_ideas enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;

create policy "communities are public"
  on public.communities for select to anon, authenticated
  using (true);

create policy "community owners update their communities"
  on public.communities for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "community owners delete their communities"
  on public.communities for delete to authenticated
  using (created_by = auth.uid());

create policy "community ideas are private to their author"
  on public.community_ideas for select to authenticated
  using (user_id = auth.uid());

create policy "members read their own memberships"
  on public.community_members for select to authenticated
  using (user_id = auth.uid());

create policy "users join public communities"
  on public.community_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'member'
    and exists (
      select 1 from public.communities c
      where c.id = community_id
    )
  );

create policy "members may leave communities"
  on public.community_members for delete to authenticated
  using (user_id = auth.uid() and role = 'member');

create policy "community post authors read their own rows"
  on public.community_posts for select to authenticated
  using (author_id = auth.uid());

create policy "members write community posts"
  on public.community_posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.community_members cm
      where cm.community_id = public.community_posts.community_id
        and cm.user_id = auth.uid()
    )
  );

create policy "authors and community owners delete posts"
  on public.community_posts for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
  );

grant select on public.communities to anon, authenticated;
grant update, delete on public.communities to authenticated;
grant select on public.community_ideas to authenticated;
grant select, insert, delete on public.community_members to authenticated;
grant select, insert, delete on public.community_posts to authenticated;

create view public.community_directory
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
  c.created_by = auth.uid() as is_owner
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

create view public.community_post_cards
with (security_barrier = true)
as
select
  cp.id,
  cp.community_id,
  c.slug as community_slug,
  cp.title,
  cp.body,
  cp.created_at,
  split_part(coalesce(nullif(p.display_name, ''), 'Member'), ' ', 1) as author_name,
  coalesce(p.initials, '?') as author_initials,
  p.avatar_url as author_avatar_url,
  cp.author_id = auth.uid() as mine
from public.community_posts cp
join public.communities c on c.id = cp.community_id
join public.profiles p on p.id = cp.author_id;

grant select on public.community_post_cards to anon, authenticated;

commit;

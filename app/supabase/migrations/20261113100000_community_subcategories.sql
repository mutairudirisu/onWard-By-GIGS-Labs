begin;

create table public.community_subcategories (
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
  name text not null check (char_length(name) between 3 and 50),
  primary key (topic, name)
);

insert into public.community_subcategories (topic, name)
values
  ('Technology', 'AI & Machine Learning'),
  ('Technology', 'Software Development'),
  ('Technology', 'Data & Analytics'),
  ('Technology', 'Product & Design'),
  ('Technology', 'Hardware & Robotics'),
  ('Technology', 'General'),
  ('Business', 'Entrepreneurship'),
  ('Business', 'Finance & Investing'),
  ('Business', 'Marketing'),
  ('Business', 'Small Business'),
  ('Business', 'Careers'),
  ('Business', 'General'),
  ('Education & Career', 'Study Groups'),
  ('Education & Career', 'Scholarships'),
  ('Education & Career', 'Job Search'),
  ('Education & Career', 'Skills & Training'),
  ('Education & Career', 'Mentorship'),
  ('Education & Career', 'General'),
  ('Wellness', 'Fitness'),
  ('Wellness', 'Mental Health'),
  ('Wellness', 'Nutrition'),
  ('Wellness', 'Mindfulness'),
  ('Wellness', 'Healthy Habits'),
  ('Wellness', 'General'),
  ('Arts & Design', 'Visual Arts'),
  ('Arts & Design', 'Photography'),
  ('Arts & Design', 'Writing'),
  ('Arts & Design', 'Music'),
  ('Arts & Design', 'Crafts'),
  ('Arts & Design', 'General'),
  ('Food & Drink', 'Cooking'),
  ('Food & Drink', 'Baking'),
  ('Food & Drink', 'Restaurants'),
  ('Food & Drink', 'Coffee & Tea'),
  ('Food & Drink', 'Food Culture'),
  ('Food & Drink', 'General'),
  ('Sports', 'Football'),
  ('Sports', 'Basketball'),
  ('Sports', 'Running'),
  ('Sports', 'Cycling'),
  ('Sports', 'Fitness'),
  ('Sports', 'General'),
  ('Travel', 'Destinations'),
  ('Travel', 'Solo Travel'),
  ('Travel', 'Backpacking'),
  ('Travel', 'Travel Tips'),
  ('Travel', 'Local Guides'),
  ('Travel', 'General'),
  ('Lifestyle', 'Fashion'),
  ('Lifestyle', 'Home & Living'),
  ('Lifestyle', 'Parenting'),
  ('Lifestyle', 'Gaming'),
  ('Lifestyle', 'Personal Growth'),
  ('Lifestyle', 'General'),
  ('Other', 'Events'),
  ('Other', 'Local Communities'),
  ('Other', 'Questions'),
  ('Other', 'Recommendations'),
  ('Other', 'General');

alter table public.community_subcategories enable row level security;

create policy "community subcategories are public"
  on public.community_subcategories for select to anon, authenticated
  using (true);

grant select on public.community_subcategories to anon, authenticated;

alter table public.communities
  add column subcategory text not null default 'General'
    check (char_length(btrim(subcategory)) between 3 and 50),
  add constraint communities_topic_subcategory_fkey
    foreign key (topic, subcategory)
    references public.community_subcategories (topic, name);

create index communities_topic_subcategory_idx
  on public.communities (topic, subcategory, created_at desc);

create function public.create_community(
  p_name text,
  p_slug text,
  p_topic text,
  p_description text,
  p_idea text,
  p_community_type text,
  p_is_mature boolean,
  p_subcategory text
)
returns table (id uuid, slug text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_created record;
begin
  if char_length(trim(coalesce(p_subcategory, ''))) not between 3 and 50 then
    raise exception 'Choose a subcategory for this community.';
  end if;

  select *
  into v_created
  from public.create_community(
    p_name,
    p_slug,
    p_topic,
    p_description,
    p_idea,
    p_community_type,
    p_is_mature
  );

  update public.communities
  set subcategory = trim(p_subcategory)
  where communities.id = v_created.id
    and communities.created_by = auth.uid();

  if not found then
    raise exception 'Could not assign the community subcategory.';
  end if;

  return query select v_created.id, v_created.slug;
end;
$$;

revoke all on function public.create_community(text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.create_community(text, text, text, text, text, text, boolean, text) to authenticated;

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
  c.is_mature,
  c.avatar_path,
  c.banner_path,
  c.subcategory
from public.communities c
left join lateral (
  select count(*) as member_count
  from public.community_members cm
  where cm.community_id = c.id
) m on true
left join lateral (
  select count(*) as post_count
  from public.posts p
  where p.community_id = c.id
) p on true;

grant select on public.community_directory to anon, authenticated;

commit;

begin;

create or replace function public.get_public_community_idea(p_community_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select idea
  from public.community_ideas
  where community_id = p_community_id;
$$;

revoke all on function public.get_public_community_idea(uuid) from public, anon, authenticated;
grant execute on function public.get_public_community_idea(uuid) to anon, authenticated;

commit;

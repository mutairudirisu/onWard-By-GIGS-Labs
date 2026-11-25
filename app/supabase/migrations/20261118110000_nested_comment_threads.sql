begin;

drop trigger if exists post_comments_root_parent_guard on public.post_comments;
drop function if exists public.enforce_comment_root_parent();

commit;

-- The social posts migration first tried to purge a post's files from inside the
-- database, with a trigger that deleted the rows out of storage.objects. Supabase
-- guards its own storage tables with a protect_delete() trigger, so that delete can
-- never run - it raises 42501 and takes the post's own delete down with it. The app
-- now removes the files through the Storage API instead, so the trigger is not just
-- useless, it is the only thing standing between a person and deleting their post.
-- Dropped here rather than edited out of the migration above, because that one has
-- already run and this is what a real database needs to be told.
begin;

alter table public.posts drop trigger if exists post_files_purge;
drop function if exists public.purge_post_files();

commit;

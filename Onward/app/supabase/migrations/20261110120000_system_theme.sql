-- Theme gains a third answer: follow whatever the device is doing.
--
-- The app now sends 'system', and the check constraint left over from the first schema
-- pass only ever allowed the two manual choices, so the preference would be rejected by
-- the database rather than by the app.
--
-- The old constraint is found by what it mentions instead of by name. A guarded drop of
-- one guessed name would quietly do nothing if the name were different, and the pass
-- would then add a second constraint while the first went on refusing 'system'.
--
-- No row changes: every account already stored is light or dark, and both still satisfy
-- the new rule.
begin;

do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.user_settings'::regclass
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%theme%'
  loop
    execute format('alter table public.user_settings drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.user_settings
  add constraint user_settings_theme_check
  check (theme in ('light', 'dark', 'system'));

commit;

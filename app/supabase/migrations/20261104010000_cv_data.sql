-- The CV screen keeps the parts a computer cannot derive from the log: the headline
-- someone wants on the front of a CV, links, education, and the role/dates typed over
-- each project group. Everything else is read back from on_wards at render time.
begin;

alter table public.user_settings
  add column if not exists cv jsonb not null default '{}'::jsonb;

commit;

-- Reminders on notes, and the instant a reminder actually falls due.
--
-- tasks.reminder_at has existed since the initial schema but was never written:
-- the app derived a reminder from the task's day + time columns at read time.
-- A device-level notification has to be found by the server on a schedule, so the
-- wall-clock pair is now resolved to a real instant on the device that set it and
-- stored here as UTC. notes gains the same column; tasks keeps day+time as the
-- source of truth the UI renders from.

begin;

-- ---------------------------------------------------------------- notes
alter table public.notes add column if not exists reminder_at timestamptz;

create index if not exists notes_user_reminder_idx
  on public.notes (reminder_at)
  where reminder_at is not null;

-- ---------------------------------------------------------------- backfill
-- Existing task reminders were never written to the column. Rebuild them at the
-- +01 wall clock the app has always implied for its users; the client overwrites
-- each row with the device's true instant the next time that task is saved.
update public.tasks
   set reminder_at = (day::text || 'T' || "time" || ':00+01')::timestamptz
 where reminder_at is null
   and day is not null
   and "time" is not null
   and "time" ~ '^[0-9]{1,2}:[0-9]{2}$';

commit;

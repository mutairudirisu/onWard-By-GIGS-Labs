-- Run in the Supabase SQL Editor after enabling pg_cron, pg_net, and Vault,
-- creating the Vault secret named onward_cron_secret, and deploying the API.
-- Re-running cron.schedule with this job name updates the existing schedule.

do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'onward_cron_secret'
  ) then
    raise exception 'Add onward_cron_secret to Supabase Vault before scheduling push delivery.';
  end if;
end;
$$;

select cron.schedule(
  'onward-push-delivery',
  '* * * * *',
  $job$
    select net.http_get(
      url := 'https://myonward.vercel.app/api/cron/push',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'onward_cron_secret'
        )
      ),
      timeout_milliseconds := 10000
    );
  $job$
);

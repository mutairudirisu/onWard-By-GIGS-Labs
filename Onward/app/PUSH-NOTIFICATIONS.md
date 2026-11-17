# Production push notifications

Background reminders are delivered by Supabase Cron through the Vercel API
route and Web Push. The browser's service worker displays notifications and
handles notification clicks.
Checklist reminders are stored on the device as before and are also scheduled
on the server; scheduled focus sessions are kept locally for the device's list
and on the server for delivery.

## Setup

1. Apply `supabase/migrations/20261111130000_web_push.sql`,
   `supabase/migrations/20261116170000_push_notification_automations.sql`, and
   `supabase/migrations/20261118100000_comment_replies_and_social_push.sql`, plus
   the API rate-limit migrations `20261113150000_api_rate_limits.sql` and
   `20261113153000_api_ip_rate_limits.sql` to the production Supabase project
   before deploying the corresponding API code.
2. Generate a VAPID key pair in `app`:

   ```sh
   npx web-push generate-vapid-keys
   ```

3. Configure these variables in the local environment and Vercel:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: VAPID public key.
   - `VAPID_PRIVATE_KEY`: VAPID private key; server-only.
   - `VAPID_SUBJECT`: monitored `mailto:` address or the production site URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key; server-only.
   - `CRON_SECRET`: long random secret used to authenticate the cron endpoint.
4. Deploy the app from `app` on your current Vercel plan. The project does not
   declare a Vercel Cron because Hobby plans reject schedules more frequent than
   daily. After deployment, remove any old Vercel Cron for `/api/cron/push` if
   one remains in the Vercel dashboard.
5. In the Supabase Dashboard, enable the `pg_cron`, `pg_net`, and Vault
   extensions. Add a Vault secret named `onward_cron_secret` whose value is the
   same `CRON_SECRET` configured in Vercel. Do not put the value in source code.
6. After deploying, run `supabase/push-cron-setup.sql` in the Supabase SQL
   Editor. It calls `/api/cron/push` every minute through Supabase Cron.
7. In an installed PWA or supported browser, sign in and turn on Push
   notifications in Settings. Permission is requested only after that user
   action; each browser/device gets its own subscription.

## Behavior and limitations

- Reminder times are sent as absolute UTC instants calculated from the device's
  local time zone. Supabase Cron checks due items at one-minute intervals.
- The server checks the account's existing `user_settings.notifications`
  preference immediately before delivery. Turning it off suppresses delivery.
- New posts notify subscribed followers (and members of the selected community);
  scheduled posts notify at their scheduled time. New comments notify the post
  author, and replies notify the parent commenter and post author. Tapping the
  notification opens the post; comment and reply alerts open its comments sheet.
- Replies are stored as one-level threads beneath their parent comment. Deleting
  a parent comment also deletes its replies.
- The admin console manages four optional automatic push campaigns: Monday
  motivation (08:30), a usage-based check-in (18:00 only when no activity was
  logged that day), a Friday reflection (16:00 when no onWard was logged that
  week), and a gentle return message after three inactive days.
- Automatic campaigns are paused until an admin enables them. Times use
  Africa/Lagos; sends are blocked during 20:00–08:00. A user receives no more
  than one automated broadcast per day or three in a rolling seven-day period.
  The daily and weekly prompts are suppressed when the user has recently logged
  activity, and a return message is sent only once per inactive period.
- Checklist reminders remain available as in-app alerts when background push is
  unavailable. Focus sessions can also be started locally while the app is open.
- Notification actions are platform-dependent. The focus action starts the
  configured timer when the app is opened; a delayed start action expires after
  30 minutes.
- Android supports Web Push in installed PWAs on current browsers. iOS/iPadOS
  requires an installed Home Screen web app and iOS/iPadOS 16.4 or newer.
  Browsers without Push API support fall back to app-open reminders.
- Supabase Cron is not invoked by local development. Test schedules on a deployed
  preview/production environment after applying the migration and configuring
  secrets. The cron endpoint rejects requests without `CRON_SECRET`.

## Operational checks

- Confirm a device appears in `push_subscriptions` after enabling notifications.
- Confirm `onward-push-delivery` appears in `cron.job` and check its recent
  results in `cron.job_run_details`. The asynchronous HTTP response is recorded
  in `net._http_response`.
- Schedule a checklist or focus notification one or two minutes ahead and check
  `push_jobs` for the due job, then its `sent_at`.
- Repeated cron runs cannot claim a job concurrently. Temporary endpoint errors
  are retried up to five times; expired subscriptions are removed.
- Never expose `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `CRON_SECRET`
  in client variables or source control.
- IP-based API limits trust Vercel's `x-vercel-forwarded-for` header, which
  Vercel overwrites with the client IP. A different hosting provider needs an
  equivalent trusted-IP integration before these API routes are deployed.

# Production push notifications

Background reminders are delivered by the Vercel Cron route and Web Push. The
browser's service worker displays notifications and handles notification clicks.
Checklist reminders are stored on the device as before and are also scheduled
on the server; scheduled focus sessions are kept locally for the device's list
and on the server for delivery.

## Setup

1. Apply `supabase/migrations/20261111130000_web_push.sql` and the API rate-limit
   migrations `20261113150000_api_rate_limits.sql` and
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
4. Deploy the app with a Vercel plan that supports a one-minute cron interval.
   `vercel.json` calls `/api/cron/push` once per minute. Configure all secrets
   for the production deployment before enabling reminders.
5. In an installed PWA or supported browser, sign in and turn on Push
   notifications in Settings. Permission is requested only after that user
   action; each browser/device gets its own subscription.

## Behavior and limitations

- Reminder times are sent as absolute UTC instants calculated from the device's
  local time zone. The cron checks due items at one-minute intervals.
- The server checks the account's existing `user_settings.notifications`
  preference immediately before delivery. Turning it off suppresses delivery.
- Checklist reminders remain available as in-app alerts when background push is
  unavailable. Focus sessions can also be started locally while the app is open.
- Notification actions are platform-dependent. The focus action starts the
  configured timer when the app is opened; a delayed start action expires after
  30 minutes.
- Android supports Web Push in installed PWAs on current browsers. iOS/iPadOS
  requires an installed Home Screen web app and iOS/iPadOS 16.4 or newer.
  Browsers without Push API support fall back to app-open reminders.
- Vercel Cron is not invoked by local development. Test schedules on a deployed
  preview/production environment after applying the migration and configuring
  secrets. The cron endpoint rejects requests without `CRON_SECRET`.

## Operational checks

- Confirm a device appears in `push_subscriptions` after enabling notifications.
- Schedule a checklist or focus notification one or two minutes ahead and check
  `push_jobs` for the due job, then its `sent_at`.
- Repeated cron runs cannot claim a job concurrently. Temporary endpoint errors
  are retried up to five times; expired subscriptions are removed.
- Never expose `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `CRON_SECRET`
  in client variables or source control.
- IP-based API limits trust Vercel's `x-vercel-forwarded-for` header, which
  Vercel overwrites with the client IP. A different hosting provider needs an
  equivalent trusted-IP integration before these API routes are deployed.

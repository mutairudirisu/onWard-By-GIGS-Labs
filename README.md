# onWard

onWard is a personal progress and work-tracking platform built for students and professionals. It combines daily planning, progress journals, CV and portfolio tools, communities, social posts, direct messaging, achievements, and push notifications in one focused experience.

This repository contains three Next.js applications plus the Supabase database migrations used by the platform:

| App | Directory | Purpose | Local port |
|---|---|---|---|
| Main PWA | `app/` | Daily activity tracking, onWards, feed, communities, network, CV, portfolio, messaging, and notifications | `3000` |
| Admin console | `admin/` | User, analytics, feedback, support, broadcast, and notification administration | `3001` |
| Marketing website | `frontend/` | Public product pages, pricing, FAQ, legal information, press, careers, and contact | `3002` |

## Key features

- **Plan the day** with tasks, checklists, streaks, focus sessions, and reminders.
- **Capture progress** through onWards that record completed work, evidence, skills, and reflection.
- **Review growth** with insights, achievements, heat maps, usage reports, and leaderboards.
- **Build a professional story** with a CV and shareable portfolio.
- **Connect and share** through the Exchange feed, polls, comments, communities, profiles, and direct messages.
- **Receive notifications** through in-app alerts and installable PWA web push notifications.
- **Manage the platform** through the authenticated admin console.

## Technology

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, RPCs, Storage, and Row Level Security
- Web Push and a PWA service worker
- OpenAI for the Exchange Proofread server route

## Repository layout

```text
app/
  app/             Main PWA routes
  components/      PWA components
  lib/             Client, data, push, CV, and portfolio utilities
  public/          PWA manifest, icons, service worker, and offline page
  supabase/        Database migrations and operational SQL
admin/
  app/             Admin routes and server API
  components/      Admin interface components
  lib/             Admin data and session utilities
frontend/
  app/             Public website routes
  components/      Marketing and legal page components
  lib/             Shared public-site configuration
.github/workflows/ Dependency and CodeQL security audits
```

## Prerequisites

- Node.js 22
- npm
- A Supabase project
- Vercel or another Next.js-compatible deployment platform

## Local setup

Install dependencies separately in each application:

```powershell
cd app
npm ci

cd ..\admin
npm ci

cd ..\frontend
npm ci
```

Create each app's local environment file from its example:

```powershell
Copy-Item app\.env.example app\.env.local
Copy-Item admin\.env.example admin\.env.local
Copy-Item frontend\.env.example frontend\.env.local
```

Update `app/.env.local` with the Supabase and optional integration values.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-anon-key>
OPENAI_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:<monitored-address>
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Keep service-role, private, OpenAI, VAPID-private, and cron values server-only. Never prefix secrets with `NEXT_PUBLIC_`.

The marketing site can optionally set:

```env
NEXT_PUBLIC_APP_URL=https://your-main-app.example
NEXT_PUBLIC_MAIL_DOMAIN=your-domain.example
```

## Run locally

Open separate terminals from the repository root:

```powershell
cd app
npm run dev
```

The main PWA is available at `http://localhost:3000`.

```powershell
cd admin
npm run dev
```

The admin console is available at `http://localhost:3001`.

```powershell
cd frontend
npm run dev
```

The marketing website is available at `http://localhost:3002`.

## Supabase setup

Apply the SQL migrations in `app/supabase/migrations/` to the project in timestamped filename order. The migrations cover authentication, profiles, activity, social feeds, communities, CV data, messaging, storage, admin access, rate limits, and push notifications.

For push notifications, follow [app/PUSH-NOTIFICATIONS.md](app/PUSH-NOTIFICATIONS.md). It documents the required migrations, VAPID configuration, Supabase Cron setup, delivery behavior, and operational checks.

For deployment security considerations and known operational follow-ups, see [SECURITY-REVIEW.md](SECURITY-REVIEW.md).

For a system-level use case and DFD explanation of Supabase, see [SUPABASE-ARCHITECTURE.md](SUPABASE-ARCHITECTURE.md). The generated application architecture diagrams are in [architecture-diagram.md](.github/modernize/assessment/engines/facts/architecture-diagram.md).

## Build and validation

Run each application independently:

```powershell
cd app
npm run build
npm run lint
npm audit --audit-level=high
```

Repeat `npm run build` and `npm audit --audit-level=high` for `admin/` and `frontend/`. The repository workflow also performs dependency audits and CodeQL analysis for JavaScript and TypeScript.

## PWA and push notifications

The main application includes:

- Installable PWA metadata and icons.
- PWA installation instructions shown when users choose **Get onWard**.
- Browser-managed installation with 192px and 512px manifest icons.
- A service worker for app updates and offline fallback.
- Browser push subscriptions.
- Scheduled checklist and focus reminders.
- Server-side social, community, comment, reply, and connection notifications.
- Supabase Cron delivery for deployed environments.

Push delivery requires HTTPS, VAPID keys, server secrets, the push database migrations, and scheduled cron configuration.

## Security

The application uses Supabase Row Level Security and server-side authorization for sensitive operations. Production deployments should also:

- Apply all required database migrations before deploying related routes.
- Keep the Supabase service-role key and API secrets out of browser code.
- Configure trusted-IP API protection on a compatible hosting platform.
- Set CSP and security headers in every deployed application.
- Verify Storage and backup policies in the Supabase project.
- Review [SECURITY-REVIEW.md](SECURITY-REVIEW.md) before public launch.

## Contributing

1. Create a focused branch for the change.
2. Make and test changes in the relevant application.
3. Run the smallest relevant build, lint, and security checks.
4. Verify database changes against the migration set and sensitive operations across authorized and unauthorized users.
5. Open a pull request with the affected app, setup changes, and validation performed.

# onWard

A personal progress and work-tracking platform for students and professionals.

onWard combines daily planning, progress journals, CV and portfolio tools, social communities, direct messaging, achievements, and push notifications in one focused PWA.

The repository contains three Next.js applications backed by one Supabase project:

| App | Directory | Purpose | Local port |
| --- | --- | --- | --- |
| Main PWA | `app/` | Daily tracking, onWards, Exchange, communities, network, CV, portfolio, and messaging | `3000` |
| Admin console | `admin/` | Users, analytics, feedback, support, broadcasts, and notification automation | `3001` |
| Marketing website | `frontend/` | Public product, pricing, FAQ, legal, press, careers, and contact pages | `3002` |

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Supabase setup](#supabase-setup)
- [Push notification setup](#push-notification-setup)
- [Environment variables](#environment-variables)
- [Running in development](#running-in-development)
- [Building for production](#building-for-production)
- [Deployment notes](#deployment-notes)
- [Security architecture](#security-architecture)
- [Architecture documentation](#architecture-documentation)
- [User roles](#user-roles)

---

## Features

**For users**
- Plan the day with tasks, checklists, streaks, focus sessions, and reminders.
- Capture completed work as onWards with impact, evidence, reflections, and skills.
- Review growth through insights, heat maps, achievements, usage reports, and leaderboards.
- Build a CV and create a shareable portfolio from selected work.
- Share posts, polls, comments, replies, achievements, and documents through the Exchange.
- Join communities, find people, manage connections, and send direct messages.
- Receive in-app and installable PWA web push notifications.

**For administrators**
- Review live user, activity, and subscription metrics.
- Search users and inspect account details.
- Manage feedback and support activity.
- Create broadcasts and control optional push automation campaigns.
- Review audit and platform activity.

---

## Tech stack

**Frontend** — Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, and PWA browser APIs.

**Backend** — Supabase Auth, PostgreSQL, Row Level Security, RPC functions, Storage, pg_cron, pg_net, and Vault.

**Integrations** — Web Push using VAPID, Supabase Realtime, OpenAI-powered proofreading and transcription, and Vercel-compatible server routes.

---

## Repository layout

```text
onWard/
├── README.md
├── SECURITY-REVIEW.md
├── SUPABASE-ARCHITECTURE.md
├── app/                         # Main PWA
│   ├── app/                     # App Router pages and API routes
│   ├── components/              # PWA components
│   ├── lib/                     # Data, auth, push, CV, and utility modules
│   ├── public/                  # Manifest, icons, offline page, and service worker
│   ├── supabase/                # Migrations and operational SQL
│   ├── .env.example
│   └── package.json
├── admin/                       # Authenticated admin console
│   ├── app/                     # Admin pages and server API
│   ├── components/              # Admin interface components
│   ├── lib/                     # Admin session and data modules
│   ├── .env.example
│   └── package.json
├── frontend/                    # Public marketing website
│   ├── app/                     # Public and legal routes
│   ├── components/              # Marketing components
│   ├── lib/                     # Public-site configuration
│   ├── .env.example
│   └── package.json
└── .github/workflows/           # Dependency audit and CodeQL workflows
```

---

## Prerequisites

- **Node.js 22+** and npm
- **A Supabase project** with Auth, PostgreSQL, Storage, and RLS
- **Vercel or another Next.js-compatible deployment platform**
- **HTTPS** for PWA installation and browser push notifications
- *(Optional)* an OpenAI API key for proofreading and transcription

---

## Quick start

```powershell
# 1. Install dependencies in each application
cd app
npm ci
cd ..\admin
npm ci
cd ..\frontend
npm ci
cd ..

# 2. Create local environment files
Copy-Item app\.env.example app\.env.local
Copy-Item admin\.env.example admin\.env.local
Copy-Item frontend\.env.example frontend\.env.local
```

Configure at least the Supabase URL and publishable key in `app/.env.local` and `admin/.env.local`, then run the applications in separate terminals.

```powershell
cd app
npm run dev
```

```powershell
cd admin
npm run dev
```

```powershell
cd frontend
npm run dev
```

- Main PWA: `http://localhost:3000`
- Admin console: `http://localhost:3001`
- Marketing website: `http://localhost:3002`

---

## Supabase setup

Create a Supabase project and apply the SQL migrations in `app/supabase/migrations/` in timestamped filename order.

The migrations cover:
- Profiles and account bootstrap
- Tasks, notes, onWards, skills, evidence, and activity
- CV and portfolio sharing
- Feed posts, polls, comments, reactions, and media
- Communities and dynamic taxonomy
- Connections and direct messaging
- Admin RPC functions
- API and IP rate limits
- Push subscriptions, push jobs, and automated campaigns
- Storage buckets and Storage policies

Use the Supabase dashboard SQL editor or a migration workflow to apply every required migration before deploying the application code that depends on it.

The publishable/anon key is intended for browser use when every public table and Storage object is protected by RLS. Never place the service-role key in browser code or a `NEXT_PUBLIC_*` variable.

---

## Push notification setup

The main PWA supports installable PWA web push with scheduled and social notifications.

1. Apply the push migrations and the API rate-limit migrations.
2. Generate a VAPID key pair in `app/`:

   ```powershell
   cd app
   npx web-push generate-vapid-keys
   ```

3. Configure the VAPID, Supabase service-role, and cron secrets.
4. Enable the `pg_cron`, `pg_net`, and Vault Supabase extensions.
5. Create a Vault secret named `onward_cron_secret` containing the same value as `CRON_SECRET`.
6. Deploy the PWA, then run `app/supabase/push-cron-setup.sql` in the Supabase SQL editor.

Supabase Cron calls `/api/cron/push` once per minute in the configured deployment. The route claims due jobs, checks notification preferences and subscriptions, sends VAPID notifications, removes expired endpoints, and retries temporary delivery failures.

See [app/PUSH-NOTIFICATIONS.md](app/PUSH-NOTIFICATIONS.md) for setup details and operational checks.

---

## Environment variables

### Main PWA — `app/.env.local`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key used in browser and authenticated clients. |
| `OPENAI_API_KEY` | Server-only key for proofreading and transcription. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser-safe VAPID public key. |
| `VAPID_PRIVATE_KEY` | Server-only VAPID private key. |
| `VAPID_SUBJECT` | Monitored `mailto:` address or production site URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged push and operational routes. |
| `CRON_SECRET` | Long random secret used to authenticate Supabase Cron requests. |

### Admin console — `admin/.env.local`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key. |

### Marketing website — `frontend/.env.local`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Main PWA URL used for sign-in and sign-up links. Defaults to `https://myonward.vercel.app`. |
| `NEXT_PUBLIC_MAIL_DOMAIN` | Domain used to build public contact addresses. |

Keep `OPENAI_API_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` server-only.

---

## Running in development

Run the applications in separate terminals:

```powershell
cd app
npm run dev
```

```powershell
cd admin
npm run dev
```

```powershell
cd frontend
npm run dev
```

Supabase Cron is not invoked by local development. Test push schedules only after applying the migrations and deploying the PWA with working server secrets.

---

## Building for production

Run validation in each application independently:

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

# onWard Security Review

**Reviewed:** 2026-11-13  
**Scope:** `Onward/app`, `Onward/admin`, `Onward/frontend`, their Supabase migrations, and the current `myonward.vercel.app` production deployment.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `Onward/app/supabase/migrations/20261031060000_initial_schema.sql` | 213-226 | Profile owner insert/delete policies combined with broad client table grants could let users replace their own profile and change the plan. Client profile insert/delete and plan updates have been revoked; live privileges were previously verified. | 8/10 |
| 2 | 🟠 HIGH | `Onward/{app,admin,frontend}/package-lock.json` | app: 1791; admin: 1658; frontend: 1554 | Vulnerable transitive PostCSS versions. All three applications now resolve PostCSS to the patched 8.5.32 line; `npm audit --audit-level=high` reports zero vulnerabilities in each. | 10/10 |
| 3 | 🟡 MEDIUM | `Onward/app/lib/supabase.ts`; `Onward/app/lib/db.ts` | 1, 12; 1, 192+ | The main PWA still performs many Supabase data reads and writes directly from browser code. Admin data RPCs were moved behind a server route with bearer-token validation and `admin_me` authorization, but the main app and browser auth still use Supabase clients. The strict server-only database requirement remains incomplete. | 10/10 |
| 4 | 🟡 MEDIUM | `Onward/app/supabase/migrations/20261113141900_public_community_ideas.sql` | 3-16 | The public `SECURITY DEFINER` RPC exposes community idea text to anonymous visitors. This is intentional under the prior explicit decision to make ideas visible to all visitors; keep only while that decision stands. | 10/10 |
| 5 | 🟡 MEDIUM | `Onward/{app,admin,frontend}/middleware.ts` | app/admin: 1-39; frontend: 1-32 | Nonce-based CSP is implemented in source and verified locally, but the production deployment has not received these changes. The live homepage currently returns no CSP header. | 10/10 |
| 6 | 🟡 MEDIUM | `Onward/app/supabase/migrations/20261113153000_api_ip_rate_limits.sql`; `Onward/app/lib/api-security.ts` | migration: 3-82; helper: 144-194 | Trusted Vercel-IP limits and sanitized auth-failure logs are implemented locally. The migration could not be applied through the signed-in dashboard editor in this session, and the code has not been deployed. Do not deploy the changed API routes until the migration is applied and `SUPABASE_SERVICE_ROLE_KEY` is configured. Central alerting is not configured. | 9/10 |
| 7 | 🟡 MEDIUM | Supabase project settings and Storage policies | N/A | Production backup configuration and live Storage access behavior remain unverified. Source migrations define private owner-scoped `ward-evidence` storage and public post/community media buckets. Production HTTPS redirection (308) and HSTS were verified; the dashboard identifies the Supabase project as Free, but backup availability/retention was not confirmed. | 7/10 |

## Completed in this working tree

- Added nonce CSPs to all three Next.js apps, along with `nosniff`, frame denial, referrer policy, and production HSTS response headers.
- Moved service-worker caching away from navigation HTML; only static assets and a generic offline page are cached.
- Added Vercel-trusted IP rate limiting for the PWA API routes, HMAC-hashing IPs before storage and logging authentication failures without tokens or raw IPs.
- Moved admin data RPC calls behind a server-only route that validates the action, verifies the bearer token, checks `admin_me`, and returns private no-store responses.
- Added the admin route's Zod validation and sanitized authorization-failure logs.
- Extended the weekly dependency audit and Dependabot coverage to the marketing site.
- Previously fixed profile privilege escalation and PostCSS advisories; Supabase profile and user-rate-limit controls were applied and verified in the prior security pass.

## Validation

- Production builds pass for `Onward/app`, `Onward/admin`, and `Onward/frontend`.
- `npm audit --audit-level=high` reports zero vulnerabilities in all three apps.
- Local production responses from all three apps returned CSP headers; all rendered script tags carried the matching response nonce.
- Admin API tests returned 401 for missing/invalid bearer tokens, 400 for an unsupported action, and `Cache-Control: private, no-store`.
- Live production returned HTTPS redirect 308 and HSTS. It still runs the prior deployment, so the new CSP and service-worker behavior are not live.

## Outstanding before public registration

1. Apply `20261113153000_api_ip_rate_limits.sql` to production Supabase, verify the function grants/table permissions, configure the required server-only key, then deploy.
2. Deploy the CSP and service-worker changes; re-test auth, OAuth, images, uploads, push, and offline behavior against production.
3. Plan the main app's server-only data-access migration; do not replace the client data layer with an unrestricted proxy.
4. Verify Supabase backup plan, schedule, retention, and restore procedure; run authenticated cross-user, admin-boundary, and Storage-policy tests.
5. Keep the public community-idea exposure only if the product owner continues to approve it.
6. Push the workflow changes and verify that scheduled GitHub Actions and Dependabot checks are active. They are present locally but were not confirmed active remotely.

No commit or push was made.

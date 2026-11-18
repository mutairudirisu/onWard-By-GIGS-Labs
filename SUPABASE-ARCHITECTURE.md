# Supabase Use Case and Data Flows

onWard uses Supabase as an application backend platform, not just a database. It centralizes identity, relational data, authorization, file storage, server functions, realtime subscriptions, scheduling, rate limits, and push-job state.

## Responsibility boundary

| Concern | Supabase handles | onWard application handles |
|---|---|---|
| Sign-in | OAuth, email authentication, JWT issuance, sessions | Sign-in UI, account routing, session context |
| Authorization | RLS policies and JWT claims | UX rules and route-level checks |
| Data | PostgreSQL tables, indexes, triggers, constraints | Data-shaped TypeScript services and domain flows |
| Compound operations | PostgreSQL RPC functions | Request orchestration and result presentation |
| Files | Buckets, object paths, MIME limits, Storage policies | Upload, preview, sharing, and deletion flows |
| Background work | pg_cron, pg_net, Vault, push queue | Cron authorization, VAPID delivery, retry handling |
| External AI | No direct integration | Server-only OpenAI routes |
| Push delivery | Subscription and job persistence | Browser subscription API and Web Push delivery |

## Data Flow Diagram - Level 0

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart LR
    User["Signed-in User"]
    Visitor["Anonymous Visitor"]
    AdminUser["Platform Admin"]
    PWAApp["onWard PWA"]
    AdminApp["Admin Console"]
    Website["Marketing Website"]
    SupabasePlatform[("Supabase Platform")]
    OpenAIService["OpenAI API"]
    PushProvider["Browser Push Service"]

    User -->|"plans, journals, posts, messages"| PWAApp
    PWAApp -->|"authenticated requests"| SupabasePlatform
    SupabasePlatform -->|"profiles, activity, feed, network"| PWAApp
    Visitor -->|"view public pages or portfolio"| Website
    Website -->|"link public portfolio"| PWAApp
    PWAApp -->|"anonymous public reads"| SupabasePlatform
    SupabasePlatform -->|"public portfolio or community data"| PWAApp
    AdminUser -->|"administration actions"| AdminApp
    AdminApp -->|"authenticated admin RPC"| SupabasePlatform
    SupabasePlatform -->|"metrics, users, feedback"| AdminApp
    PWAApp -->|"proofread or transcription request"| OpenAIService
    SupabasePlatform -->|"scheduled claims and preferences"| PWAApp
    PWAApp -->|"VAPID delivery request"| PushProvider
    PushProvider -->|"browser notification"| User
```

## Data Flow Diagram - Level 1

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart TD
    subgraph DUser["Users"]
        DUserNode["User or Admin"]
    end
    subgraph DClient["Next.js Applications"]
        DPWA["PWA"]
        DAdmin["Admin Console"]
        DWebsite["Website"]
        DAPI["Protected Server Routes"]
    end
    subgraph DSupabase["Supabase Platform"]
        DAuth["Auth and JWT"]
        DDB[("PostgreSQL")]
        DRLS["RLS Policies"]
        DRPC["RPC Functions"]
        DStorage[("Storage Buckets")]
        DQueue["Push Queue"]
    end
    subgraph DExternal["External Systems"]
        DAI["OpenAI"]
        DPush["Browser Push"]
    end

    DUserNode -->|"credentials"| DPWA
    DPWA -->|"Supabase Auth"| DAuth
    DAuth -->|"JWT session"| DPWA
    DPWA -->|"table or RPC request"| DRLS
    DUserNode -->|"admin session"| DAdmin
    DAdmin -->|"Bearer token"| DAPI
    DAPI -->|"validate token and admin role"| DAuth
    DAPI -->|"admin RPC"| DRPC
    DRLS -->|"authorized SQL"| DDB
    DRPC -->|"transaction"| DDB
    DPWA -->|"upload or download"| DStorage
    DStorage -->|"owner or public policy"| DRLS
    DPWA -->|"AI text or audio"| DAPI
    DAPI -->|"server request"| DAI
    DWebsite -->|"public navigation"| DPWA
    DQueue -->|"claim due jobs"| DAPI
    DAPI -->|"deliver notification"| DPush
    DPush -->|"notify device"| DUserNode
```

## Authentication and authorization sequence

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
sequenceDiagram
    participant Browser
    participant Next as Next.js
    participant Auth as Supabase Auth
    participant API as PostgREST or RPC
    participant RLS as RLS Engine
    participant DB as PostgreSQL

    Browser->>Next: Open protected route
    Next->>Auth: Validate or refresh session
    Auth-->>Browser: JWT access token
    Browser->>API: Request with bearer token
    API->>RLS: Execute auth.uid and JWT checks
    RLS->>DB: Filter and authorize SQL
    DB-->>RLS: Allowed rows or denial
    RLS-->>Browser: Authorized result
```

## Push notification sequence

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
sequenceDiagram
    participant Browser
    participant PWA as PWA API
    participant DB as Supabase PostgreSQL
    participant Cron as Supabase Cron
    participant Server as Vercel Push Route
    participant Push as Browser Push Provider

    Browser->>PWA: Enable push notifications
    PWA->>DB: Store device subscription
    DB-->>PWA: Subscription saved
    DB->>DB: Create scheduled or social push job
    Cron->>Server: Every minute with cron secret
    Server->>DB: Claim due jobs
    DB-->>Server: Claimed jobs
    Server->>DB: Read preferences and subscriptions
    Server->>Push: Send VAPID notification
    Push-->>Browser: Display notification
    Server->>DB: Mark sent or schedule retry
```

## Core data model

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
erDiagram
    AUTH_USER ||--|| PROFILE : has
    AUTH_USER ||--o{ TASK : owns
    AUTH_USER ||--o{ NOTE : owns
    AUTH_USER ||--o{ ONWARD : creates
    ONWARD ||--o{ EVIDENCE : contains
    ONWARD }o--o{ SKILL : develops
    AUTH_USER ||--o{ ACTIVITY_DAY : records
    AUTH_USER ||--|| USER_SETTINGS : configures
    AUTH_USER ||--o{ POST : publishes
    POST ||--o{ POST_COMMENT : receives
    POST ||--o{ POST_LIKE : receives
    AUTH_USER ||--o{ CONNECTION : participates
    AUTH_USER ||--o{ DIRECT_MESSAGE : sends
    AUTH_USER ||--o{ PUSH_SUBSCRIPTION : registers
    AUTH_USER ||--o{ PUSH_JOB : receives
```

## Supabase services used by onWard

### Authentication

Supabase Auth owns email and OAuth account identity. Next.js receives and stores the resulting session, and PostgreSQL receives the JWT through authenticated Supabase Data API requests. The initial profile is linked to `auth.users.id`, so deleting an account cascades to owned application records.

### PostgreSQL and RLS

PostgreSQL stores the relational state and enforces constraints, indexes, triggers, and cascading deletes. RLS is the primary browser authorization boundary. Policies compare `auth.uid()` with profile IDs or `user_id` columns, enforce participant membership for conversations, and permit public access only for explicitly shareable records.

This protects direct browser access: the publishable key identifies the project, the JWT identifies the user, and RLS decides whether a query can read or mutate a row.

### RPC functions

RPC functions handle operations that require coordinated database logic or elevated context:

- Activity recording and leaderboard calculation
- Connection requests and direct conversations
- Public portfolio and community access
- Search and network catch-up
- Poll voting
- Admin metrics and push automation updates
- Push-job claiming and automated job scheduling

### Storage

Supabase Storage separates public and private content:

| Bucket | Access | Typical use |
|---|---|---|
| `post-media` | Public | Images and video attached to Exchange posts |
| `community-media` | Public | Community profile and banner media |
| `ward-evidence` | Private | Images, PDFs, documents, and presentation evidence |
| `direct-message-media` | Private | Participant-only files in direct conversations |

Storage policies limit upload ownership by user-folder path. Private buckets require authorization and appropriate participant or owner policies.

### pg_cron and push jobs

Supabase Cron calls the Next.js push route once per minute. The route uses a cron secret, claims jobs with `SKIP LOCKED`, validates notification preferences, reads subscriptions, sends VAPID notifications, removes expired subscriptions, and updates retries or completion state.

This removes timing and retry coordination from the browser. The browser only registers a device; Supabase stores schedules and the server route performs delivery.

## What complexity Supabase replaces

Without Supabase, onWard would need separate services or substantial implementation for:

- Password, OAuth, account, and JWT lifecycle
- Auth middleware and session refresh
- PostgreSQL hosting and connection management
- API-to-database serialization
- Row ownership and cross-user authorization
- Private and public file storage APIs
- Object upload, MIME, size, and path policies
- Transactional SQL functions and concurrency-safe job claims
- Scheduled HTTP jobs and secret storage
- Push subscription persistence and delivery retry state

Supabase does not eliminate application security work. Environment secrets, RLS policy review, migration correctness, rate limiting, Storage policies, and privileged route authorization remain explicit engineering responsibilities.

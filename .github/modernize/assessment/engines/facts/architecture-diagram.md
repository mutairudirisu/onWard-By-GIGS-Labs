# Architecture Diagram

onWard is a three-application Next.js platform backed by one Supabase project. Supabase combines identity, PostgreSQL data, row-level authorization, Storage, RPC functions, and scheduled database operations.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart TD
    subgraph Clients["Client Applications"]
        PWA["onWard PWA"]
        Admin["Admin Console"]
        Website["Marketing Website"]
    end
    subgraph Edge["Next.js Server and Edge"]
        Middleware["Security Headers and Routing"]
        API["Protected API Routes"]
        OpenAI["OpenAI Integration"]
    end
    subgraph Supabase["Supabase Backend"]
        Auth["GoTrue Authentication"]
        Postgres[("PostgreSQL")]
        RLS["Row Level Security"]
        RPC["SQL RPC Functions"]
        Storage[("Object Storage")]
        Cron["pg_cron and pg_net"]
    end
    subgraph External["External Services"]
        BrowserPush["Browser Push Service"]
        OpenAIAPI["OpenAI API"]
    end

    PWA -->|"browser session"| Middleware
    Admin -->|"bearer token"| Middleware
    Website -->|"public links"| PWA
    Middleware -->|"authorized queries"| Auth
    Middleware -->|"HTTP and RPC"| API
    API -->|"user operations"| RLS
    RLS -->|"SQL requests"| Postgres
    RPC -->|"transactional operations"| Postgres
    Postgres -->|"authorized files"| Storage
    API -->|"proofread and transcription"| OpenAI
    OpenAI -->|"API request"| OpenAIAPI
    Cron -->|"scheduled delivery"| API
    API -->|"VAPID notification"| BrowserPush
    BrowserPush -->|"display notification"| PWA
```

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| PWA | Next.js, React, TypeScript | Next.js 15, React 19 | Daily tracking, social, network, CV, and portfolio features |
| Admin | Next.js, React, TypeScript | Next.js 15, React 19 | Platform administration and broadcast control |
| Website | Next.js, React, TypeScript | Next.js 15, React 19 | Public marketing and legal content |
| Styling | Tailwind CSS | 3.4 | Shared responsive application styling |
| Identity | Supabase Auth | 2.118 client | Sessions, OAuth, account verification, and JWTs |
| Database | Supabase PostgreSQL | Managed | Application records, joins, indexes, and transactions |
| Access control | Supabase RLS and RPC | PostgreSQL policies | Enforces ownership and participant permissions |
| Files | Supabase Storage | Managed buckets | Public media and private evidence or message files |
| Scheduling | pg_cron, pg_net, Vault | Supabase extensions | Periodic push-job processing |
| External AI | OpenAI API | Server route key | Proofreading and transcription |

### Data Storage & External Services

PostgreSQL stores profiles, tasks, notes, onWards, skills, evidence records, activity, settings, shares, social content, communities, connections, messages, push jobs, subscriptions, and rate-limit state. Supabase Storage holds public post and community media plus private ward evidence and direct-message media. RLS authorizes normal database and Storage access, while SQL RPC functions centralize compound operations and admin authorization. OpenAI and browser push providers are external integrations called only from protected server routes.

### Key Architectural Decisions

- The browser uses the Supabase publishable key and authenticated JWT; RLS remains the final access boundary for tables and Storage.
- Service-role access is reserved for server routes and operational functions that intentionally bypass RLS.
- Database migrations provide the source of truth for schema, ownership policies, storage buckets, RPC functions, and scheduled delivery setup.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart LR
    subgraph CPresentation["Presentation"]
        PWAUI["PWA Pages and Components"]
        AdminUI["Admin Pages and Components"]
        PublicUI["Marketing Pages"]
    end
    subgraph CLogic["Application Logic"]
        AuthCtx["Authentication Context"]
        DataAPI["Client Data Services"]
        ProtectedAPI["Server API Routes"]
        Middleware["Content Security and Routing"]
    end
    subgraph CData["Data Access"]
        SupabaseClient["Supabase Browser Client"]
        AdminClient["Authenticated Supabase RPC Client"]
        PostgresTables[("Public PostgreSQL Tables")]
        StorageObjects[("Storage Objects")]
    end
    subgraph CInfrastructure["Infrastructure"]
        RLSRules["RLS Policies"]
        RPCFunctions["Security Definer RPC Functions"]
        CronJobs["Supabase Cron Jobs"]
        PushJobs["Push Job Queue"]
        ServiceKeys["Server-only Secrets"]
    end

    PWAUI -->|"session actions"| AuthCtx
    PWAUI -->|"reads and writes"| DataAPI
    AdminUI -->|"admin bearer token"| ProtectedAPI
    PublicUI -->|"navigation and public links"| PWAUI
    Middleware -.->|"intercepts routes"| PWAUI
    Middleware -.->|"intercepts routes"| AdminUI
    AuthCtx -->|"sign in and session"| SupabaseClient
    DataAPI -->|"table and RPC calls"| SupabaseClient
    SupabaseClient -->|"JWT authorization"| RLSRules
    RLSRules -->|"row and file checks"| PostgresTables
    RLSRules -->|"bucket policy checks"| StorageObjects
    ProtectedAPI -->|"validated admin RPC"| AdminClient
    AdminClient -->|"admin RPC call"| RPCFunctions
    RPCFunctions -->|"transaction"| PostgresTables
    CronJobs -->|"minute request"| ProtectedAPI
    ProtectedAPI -->|"claim or deliver"| PushJobs
    PushJobs -->|"jobs"| PostgresTables
    ServiceKeys -.->|"authenticate server access"| ProtectedAPI
```

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| PWA pages | Presentation | React and Next.js routes | User-facing planning, work, social, network, and profile flows |
| Admin pages | Presentation | React and Next.js routes | Metrics, users, feedback, support, broadcasts, and automations |
| Marketing pages | Presentation | React and Next.js routes | Public product, pricing, policy, and contact content |
| Authentication context | Application logic | React context | Manages Supabase sign-in, sessions, and identity state |
| Data services | Application logic | TypeScript service module | Executes table, Storage, and RPC operations |
| Protected API routes | Application logic | Next.js server routes | Validates secrets, bearer tokens, rate limits, and external integrations |
| Supabase browser client | Data access | Supabase SDK | Sends authenticated Data API and Realtime requests |
| PostgreSQL tables | Data access | Managed database | Stores relational application state |
| Storage buckets | Data access | Object storage | Stores public and private uploaded files |
| RLS policies | Infrastructure | PostgreSQL policies | Filters rows and object access by identity and ownership |
| RPC functions | Infrastructure | PostgreSQL functions | Provides compound and elevated server operations |
| Cron jobs | Infrastructure | Supabase scheduled tasks | Triggers push automation and queue processing |
| Push queue | Infrastructure | PostgreSQL tables | Stores and claims due notification jobs |

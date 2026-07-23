# Mortgage Marketing Manager Prototype Demo v1

A Phase 2 proof-of-concept application for organizing and displaying mortgage
marketing analytics across multiple social platforms.

The core concept is that one central content item can represent matching posts
published to YouTube, Instagram, and eventually other platforms. The application
normalizes those platform results into three funnel metrics:

- **Reach** — how many times the content was viewed or shown.
- **Engagements** — likes, comments, shares, saves, and reactions when available.
- **Leads** — tracked, manually entered, or simulated landing-page link clicks.

## Current status

### Phase 1 — Complete

- Simplified dashboard designed for a nontechnical user.
- Reach, Engagements, and Leads metric cards.
- Three-stage marketing funnel.
- One central content item with YouTube and Instagram platform breakdowns.
- Placeholder Campaigns, AI Agent, and Settings pages.
- Organized analytics-provider and dashboard component layers.

### Phase 2 — Complete

- SQL Server database connected through Prisma.
- Seven-table relational schema for campaigns, central content, platforms,
  accounts, posts, and current metrics.
- Baseline migration for the existing SQL Server schema.
- Reusable server-side Prisma client.
- Deterministic seed data for one campaign, one central content item, two social
  accounts, two matching platform posts, and their metrics.
- Independent TypeScript database-connection test.

The dashboard still uses the Phase 1 deterministic providers. Replacing those
values with server-side SQL queries is Phase 3.

Not included yet:

- Live YouTube API requests.
- Meta/Instagram API access.
- Social account authentication.
- Automatic social publishing.
- Functional AI agent.
- Landing-page attribution.

## Technology

- Next.js 16
- React 19
- TypeScript targeting ES2020
- SQL Server
- Prisma ORM 7 with the Microsoft SQL Server adapter
- Tailwind CSS/PostCSS tooling
- ESLint

## Local setup

Requirements:

- Node.js 22 or newer
- npm
- Git
- A reachable SQL Server instance
- A local database and login matching the values placed in `.env`

Install dependencies:

```powershell
npm install
```

Create a private local environment file from the committed template:

```powershell
Copy-Item .env.example .env
```

Update `.env` with the real local SQL Server host, port, database, username, and
password. Never commit `.env`.

Generate the Prisma client and verify the database foundation:

```powershell
npx prisma generate
npx prisma validate
npx prisma migrate status
npx prisma db seed
npx tsx scripts/testDatabaseConnection.ts
```

Start the development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

Run project checks:

```powershell
npm run lint
npm run build
```

## Current project structure

```text
app/
  api/                  Reserved for future server-side API routes
  ai-agent/             Coming-soon page
  campaigns/            Coming-soon page
  settings/             Coming-soon page
  globals.css           Shared application styling
  layout.tsx            Shared application shell and sidebar
  page.tsx              Home analytics dashboard

components/
  dashboard/
    MarketingFunnel.tsx
    MetricCard.tsx
    PlatformBreakdown.tsx
    TopContentCard.tsx
  ComingSoon.tsx
  Sidebar.tsx

services/
  analytics/
    combineMetrics.ts
    manualInstagramProvider.ts
    types.ts
    youtubeProvider.ts
  database/
    prismaClient.ts

database/
  migrations/
    0_init/
      migration.sql
  sql/
    create_mortgage_marketing_prototype.sql
  README.md
  schema.prisma
  seedDemoData.ts

scripts/
  testDatabaseConnection.ts

prisma.config.ts
.env.example
```

The generated Prisma client is written to `generated/prisma/` locally and is
ignored by Git.

## Analytics-provider design

The Phase 1 providers return a shared `PlatformPostMetrics` structure:

- `youtubeProvider.ts` currently returns deterministic YouTube demonstration
  data. It is the future boundary for the YouTube Data API.
- `manualInstagramProvider.ts` represents the manual metrics workflow planned
  before Meta API access is implemented.
- `combineMetrics.ts` combines normalized platform results for the dashboard.

Keeping the providers separate means the dashboard does not need to know
whether metrics came from an external API, manual database entry, simulated
data, or—as Phase 3 will add—SQL Server.

## Database foundation

The Phase 2 schema stores:

- Marketing campaigns.
- Stable central content identities.
- Supported social platforms.
- Social accounts.
- Platform post URLs and external IDs.
- Current post metrics.
- Current account metrics.

The seed script is repeatable and uses upserts so the same demonstration records
can be refreshed without creating duplicate platform, content, account, post,
or metrics records.

Credentials and connection strings must be supplied through ignored environment
files and must not be committed to GitHub.

## Next phase

Phase 3 will query SQL Server from the server-side dashboard, convert database
records into the existing analytics component types, and replace the current
hardcoded content and metric values without changing the visual layout.

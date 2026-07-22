# Mortgage Marketing Manager Prototype Demo v1

A Phase 1 proof-of-concept dashboard for organizing and displaying mortgage
marketing analytics across multiple social platforms.

The core concept is that one central content item can represent matching posts
published to YouTube, Instagram, and eventually other platforms. The dashboard
then normalizes those platform results into three funnel metrics:

- **Reach** — how many times the content was viewed or shown.
- **Engagements** — likes, comments, and shares.
- **Leads** — tracked or simulated landing-page link clicks.

## Phase 1 status

Phase 1 is intentionally interface-focused and uses deterministic demonstration
data.

Included:

- Simplified dashboard designed for a nontechnical user.
- Reach, Engagements, and Leads metric cards.
- Three-stage marketing funnel.
- One central content item with YouTube and Instagram platform breakdowns.
- Placeholder Campaigns, AI Agent, and Settings pages.
- Organized analytics-provider and future database folders.

Not included yet:

- SQL Server or Prisma connection.
- Live YouTube API requests.
- Meta/Instagram API access.
- Social account authentication.
- Automatic social publishing.
- Functional AI agent.
- Landing-page attribution.

## Technology

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS/PostCSS tooling
- ESLint

## Local setup

Requirements:

- Node.js 22 or newer
- npm
- Git

Install dependencies:

```powershell
npm install
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
  README.md
  schema.prisma
  seedDemoData.ts
```

## Analytics-provider design

The Phase 1 providers return a shared `PlatformPostMetrics` structure:

- `youtubeProvider.ts` currently returns deterministic YouTube demonstration
  data. It is the future boundary for the YouTube Data API.
- `manualInstagramProvider.ts` represents the manual metrics workflow planned
  before Meta API access is implemented.
- `combineMetrics.ts` normalizes and combines platform results for the
  dashboard.

Keeping the providers separate means the dashboard does not need to know
whether metrics came from an external API, manual database entry, or simulated
data.

## Database plan

The `database/` folder is a placeholder for Phase 2. The planned SQL Server
schema will store stable relationships such as:

- Central content identities.
- Social accounts.
- Platform post URLs and external IDs.
- Manually maintained Instagram metrics.
- Reproducible demo seed records.

Credentials and connection strings must be supplied through ignored environment
files and must not be committed to GitHub.

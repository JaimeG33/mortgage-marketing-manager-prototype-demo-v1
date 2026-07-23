# Mortgage Marketing Manager Prototype Demo v1

A Phase 4 proof-of-concept application for organizing and displaying mortgage
marketing analytics across multiple social platforms.

The core concept is that one central content item can represent matching posts
published to YouTube, Instagram, and eventually other platforms. The application
normalizes those platform results into three funnel metrics:

- **Reach** — how many times the content was viewed or shown.
- **Engagements** — likes, comments, shares, saves, and reactions when available.
- **Leads** — tracked or manually entered landing-page link clicks.

## Current status

### Phases 1–3 — Complete

- Dashboard and shared analytics types.
- SQL Server and Prisma relational foundation.
- Dynamically rendered SQL-backed dashboard.
- Safe conversion of Prisma `BigInt` values before React rendering.
- Controlled behavior for missing data and database failures.

### Phase 4 — Implemented

- Server-only YouTube Data API v3 client using the built-in `fetch` API.
- Batch lookup of public video statistics by exact external video ID.
- Public channel statistics lookup using the channel ID returned by each video.
- SQL refresh service that updates `CurrentPostMetrics`, `CurrentAccountMetrics`,
  `PlatformPost`, and the central content title.
- YouTube refreshes preserve application-owned `LeadClickCount` values.
- Shares, saves, and reactions remain SQL `NULL` because the public Data API does
  not provide those values.
- Failed API requests do not overwrite the previously stored SQL snapshot.
- Repeatable seed/setup for two Ramsey Show Highlights videos:
  - `HLEEwG3dNcg`
  - `P_DcMR6e73U`
- API-only and database/dashboard verification scripts.
- Optional dashboard content selection through the `content` query parameter.

Still deferred:

- Meta/Instagram API access.
- Google OAuth and owner-only YouTube Analytics reports.
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
- YouTube Data API v3
- Tailwind CSS/PostCSS tooling
- ESLint

## Local setup

Requirements:

- Node.js 22 or newer
- npm
- Git
- A reachable SQL Server instance
- A local database and login matching the values placed in `.env`
- A Google Cloud project with YouTube Data API v3 enabled
- A restricted YouTube Data API key

Install dependencies:

```powershell
npm install
```

Create a private local environment file from the committed template:

```powershell
Copy-Item .env.example .env
```

Update `.env` with the real SQL Server connection values and:

```dotenv
YOUTUBE_API_KEY="your-real-local-api-key"
```

Never commit `.env`, API keys, database passwords, or connection strings.

## Database setup

The normal repeatable setup is:

```powershell
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
```

The Phase 4 seed migrates the former placeholder YouTube account/post to The
Ramsey Show Highlights and adds the secondary content item. It does not overwrite
metrics whose source is already `YOUTUBE_API`.

For manual SSMS setup, run:

```text
database/sql/configure_phase4_ramsey_youtube_content.sql
```

The script is transactional and safe to rerun.

## YouTube API workflow

Test the API without modifying SQL Server:

```powershell
npm run youtube:test
```

Refresh all active configured YouTube posts and their channel snapshot:

```powershell
npm run youtube:refresh
```

The refresh reads video IDs from `PlatformPost.ExternalPostId`; it does not use
environment variables as the production source of truth.

Public video mapping:

```text
statistics.viewCount    -> CurrentPostMetrics.ReachCount
statistics.likeCount    -> CurrentPostMetrics.LikeCount
statistics.commentCount -> CurrentPostMetrics.CommentCount
snippet.title           -> PlatformPost.PlatformTitle and ContentItem.Title
snippet.publishedAt     -> PlatformPost.PublishedAt
snippet.channelId       -> SocialAccount.ExternalAccountId
```

Public channel mapping:

```text
statistics.subscriberCount -> CurrentAccountMetrics.AudienceCount
statistics.viewCount       -> CurrentAccountMetrics.TotalViewCount
statistics.videoCount      -> CurrentAccountMetrics.ContentCount
```

Unavailable public metrics are stored as `NULL`, not fabricated as zero. The
current dashboard treats those null fields as zero only while calculating the
available engagement subtotal.

## Verification

```powershell
npm run db:test
npm run db:test-dashboard
npm run lint
npm run build
npm run dev
```

Primary dashboard:

```text
http://localhost:3000
```

Secondary Ramsey video:

```text
http://localhost:3000/?content=ramsey-show-highlights-p-dcmr6e73u
```

After a refresh, verify that:

- Each content item retains its correct YouTube video ID.
- The YouTube rows show `YouTube API updated ...`.
- Public views, likes, and comments match the API test output.
- Instagram remains manual.
- Lead clicks remain unchanged.
- `CurrentAccountMetrics` contains the public Ramsey channel snapshot.

## Current project structure

```text
app/
  page.tsx

components/
  dashboard/
    PlatformBreakdown.tsx

services/
  analytics/
    combineMetrics.ts
    types.ts
  dashboard/
    getDashboardData.ts
  database/
    prismaClient.ts
  youtube/
    refreshYouTubeMetrics.ts
    types.ts
    youtubeDataApi.ts

database/
  migrations/0_init/migration.sql
  sql/
    configure_phase4_ramsey_youtube_content.sql
    create_mortgage_marketing_prototype.sql
  README.md
  schema.prisma
  seedDemoData.ts

scripts/
  refreshYouTubeMetrics.ts
  testDatabaseConnection.ts
  testDashboardData.ts
  testYouTubeDataApi.ts
```

The generated Prisma client is written to `generated/prisma/` locally and is
ignored by Git.

## Security and scope

The API key is used only by server-side scripts/services. Phase 4 intentionally
does not expose a public refresh route because the prototype does not yet have
authentication, authorization, CSRF protection, or rate limiting.

Owner-only analytics such as watch time, audience retention, impressions,
traffic sources, demographics, and detailed sharing reports require Google OAuth
and permission from the channel owner. That work is deferred to a later phase.

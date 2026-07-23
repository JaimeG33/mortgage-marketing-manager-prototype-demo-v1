# Mortgage Marketing Manager Prototype Demo v1

A Phase 4 proof-of-concept application for organizing and displaying mortgage
marketing analytics across multiple social platforms.

The central data model treats one marketing idea as a `ContentItem`. Each
platform-specific publication is stored as a related `PlatformPost`, allowing the
application to compare YouTube, Instagram, and future platforms without losing
the shared identity of the content.

The dashboard normalizes results into three business-facing funnel metrics:

- **Reach** — views or the closest available platform reach measurement.
- **Engagements** — likes, comments, shares, saves, and reactions when available.
- **Leads** — application-owned or manually entered lead/link-click totals.

## Current status

### Phases 1–3 — Complete

- Responsive dashboard and shared analytics types.
- SQL Server and Prisma relational foundation.
- Dynamically rendered SQL-backed dashboard.
- Safe conversion of Prisma `BigInt` values before React rendering.
- Controlled behavior for missing content, unsupported platforms, and database
  failures.

### Phase 4 — Core implementation complete

The current prototype can now:

- Retrieve live public YouTube video statistics through YouTube Data API v3.
- Match API results to individual posts by exact `PlatformPost.ExternalPostId`.
- Refresh multiple configured YouTube videos in one batch request.
- Store public views, likes, comments, titles, publication dates, and channel IDs.
- Store public channel subscribers, total channel views, and video count in
  `CurrentAccountMetrics`.
- Preserve application-owned `LeadClickCount` values during YouTube refreshes.
- Keep unavailable YouTube shares, saves, and reactions as SQL `NULL` instead of
  fabricating values.
- Retain the previous SQL snapshot when an API request fails.
- Display two separately addressable Ramsey Show Highlights content items:
  - `HLEEwG3dNcg`
  - `P_DcMR6e73U`
- Compare platform performance through expandable Reach, Engagements, and Leads
  cards.
- Display live YouTube data beside the manually stored Instagram demonstration
  data for the primary content item.

The three metric cards are interactive:

- **Reach** expands into a YouTube-versus-Instagram bar comparison.
- **Engagements** expands into per-platform bars for likes, comments, shares,
  saves, and reactions.
- **Leads** expands into the stored lead total for each platform.

### What remains for Phase 4

No required integration feature remains if the validation commands below pass.
Phase 4 can be closed after:

1. Running the final lint, build, API, database, and browser checks.
2. Reviewing that no API key or `.env` file is staged.
3. Committing and pushing the Phase 4 branch.
4. Merging the completed branch into `main`.

An authenticated browser refresh button is an optional enhancement, not a Phase 4
requirement. The CLI refresh remains the safer mechanism while the prototype has
no user authentication or rate limiting.

## Current data-source behavior

| Area | Current source | Important limitation |
| --- | --- | --- |
| YouTube reach | YouTube Data API public `viewCount` | Public views only |
| YouTube likes/comments | YouTube Data API | Shares, saves, and reactions are unavailable publicly |
| Instagram metrics | Manual demonstration row in SQL Server | Not connected to Meta yet |
| Leads | `CurrentPostMetrics.LeadClickCount` | Manually stored placeholder until attribution is built |
| Channel totals | YouTube Data API in `CurrentAccountMetrics` | Stored but not yet displayed prominently |

A YouTube API refresh does not change lead values. Lead attribution belongs to the
application and will be implemented separately.

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
- A YouTube Data API key restricted to YouTube Data API v3

Install dependencies:

```powershell
Set-Location D:\ZeTechProjects\mortgage-marketing-manager-prototype-demo-v1
npm install
```

Create the private local environment file when needed:

```powershell
Copy-Item .env.example .env
```

Update `.env` with the real SQL Server values and:

```dotenv
YOUTUBE_API_KEY="your-real-local-api-key"
```

Never commit `.env`, API keys, database passwords, or connection strings.

## Database setup

The preferred repeatable setup is:

```powershell
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
```

The Phase 4 seed migrates the original placeholder YouTube account/post to the
Ramsey account and creates the secondary content item. It does not overwrite a
metric row whose source is already `YOUTUBE_API`.

For manual SSMS setup, run:

```text
database/sql/configure_phase4_ramsey_youtube_content.sql
```

The script is transactional and safe to rerun. More database-specific guidance,
including how to inspect or edit lead values, is in `database/README.md`.

## Refreshing YouTube analytics

Test the API without modifying SQL Server:

```powershell
npm run youtube:test
```

Refresh every active configured YouTube post and the associated channel snapshot:

```powershell
npm run youtube:refresh
```

The refresh reads video IDs from `PlatformPost.ExternalPostId`; environment
variables are not used as the production source of truth for video selection.

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

## Using the dashboard

Start the application:

```powershell
npm run dev
```

Primary content item with YouTube and Instagram comparison:

```text
http://localhost:3000
```

Secondary Ramsey YouTube content item:

```text
http://localhost:3000/?content=ramsey-show-highlights-p-dcmr6e73u
```

On the dashboard:

1. Click **Reach**, **Engagements**, or **Leads** to expand its chart.
2. Click the active card again to collapse it.
3. Use **Open post** in the content section to open the stored platform URL.
4. Refresh YouTube from the CLI, then refresh the browser to see the new SQL
   snapshot.

The secondary content item currently has only a YouTube post, so its charts show
only YouTube until another platform post is linked to that `ContentItem`.

## Validation

```powershell
npm run youtube:test
npm run youtube:refresh
npm run db:test
npm run db:test-dashboard
npm run lint
npm run build
npm run dev
```

After a successful refresh, verify:

- Each content item retains its intended YouTube video ID.
- YouTube rows display `YouTube API updated ...`.
- Public views, likes, and comments match `npm run youtube:test`.
- Instagram remains manual demonstration data.
- Lead values remain unchanged.
- The expandable metric charts show the same platform values as the dashboard.
- `CurrentAccountMetrics` contains the public YouTube channel snapshot.
- No API key appears in source, browser output, Git changes, or terminal errors.

## Current project structure

```text
app/
  globals.css
  page.tsx

components/
  dashboard/
    MarketingFunnel.tsx
    MetricAnalyticsCards.tsx
    MetricCard.tsx
    PlatformBreakdown.tsx
    TopContentCard.tsx

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

## Near-future roadmap

### Phase 5 — Manual Instagram and account analytics

Likely next work:

- Add a web form for updating Instagram reach, engagement, and lead values.
- Validate nonnegative manual entries and record source/update timestamps.
- Display `CurrentAccountMetrics` on the dashboard.
- Add an in-app content selector instead of relying only on the `content` query
  parameter.
- Keep the provider boundary replaceable for a later Meta integration.

### Phase 6 — Analytics refinement

- Add date ranges and historical metric snapshots.
- Filter by campaign, content item, account, and platform.
- Distinguish unavailable metrics more explicitly from genuine zero values.
- Improve content ranking and responsive reporting.

### Phase 7 — Lead attribution proof

- Create unique tracked redirect links per platform post.
- Record click events by campaign, content, platform, account, and post.
- Replace placeholder lead values with attributable application events.

### Later owner-authorized YouTube work

Google OAuth can later connect a team-controlled channel, such as the proposed
Cobblemon test channel, to test owner-only analytics. Watch time, audience
retention, impressions, traffic sources, demographics, and similar reports are
outside the public Data API scope and are not part of the current Phase 4 build.

## Security and scope

The API key is used only by server-side scripts and services. The prototype does
not currently expose a public refresh route because it lacks authentication,
authorization, CSRF protection, and rate limiting.

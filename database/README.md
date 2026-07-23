# Database folder

This folder contains the SQL Server and Prisma foundation used by the Phase 4
YouTube-connected dashboard.

## Contents

- `schema.prisma` — the introspected seven-model SQL Server schema.
- `migrations/0_init/migration.sql` — the baseline migration for the existing
  database.
- `seedDemoData.ts` — repeatable demonstration data created with Prisma upserts.
- `sql/create_mortgage_marketing_prototype.sql` — the original SQL Server setup
  script.
- `sql/configure_phase4_ramsey_youtube_content.sql` — transactional SSMS setup
  for the two selected Ramsey Show Highlights videos.

No schema migration is required for Phase 4. The existing tables already support:

- Exact YouTube video IDs in `PlatformPost.ExternalPostId`.
- The resolved YouTube channel ID in `SocialAccount.ExternalAccountId`.
- Public video snapshots in `CurrentPostMetrics`.
- Public channel snapshots in `CurrentAccountMetrics`.

The shared Prisma client is located at:

```text
services/database/prismaClient.ts
```

The YouTube refresh service is located at:

```text
services/youtube/refreshYouTubeMetrics.ts
```

## Setup choices

Preferred repeatable setup:

```powershell
npm run db:seed
```

Manual SSMS setup:

1. Open SQL Server Management Studio.
2. Connect to the SQL Server instance containing `MortgageMarketingPrototype`.
3. Open `database/sql/configure_phase4_ramsey_youtube_content.sql`.
4. Confirm the database name in the first line.
5. Execute the full script.
6. Review the verification result set at the bottom.

Both setup paths configure:

```text
first-time-buyer-five-things          -> HLEEwG3dNcg
ramsey-show-highlights-p-dcmr6e73u    -> P_DcMR6e73U
```

The setup preserves any metric row whose `MetricsSource` is already
`YOUTUBE_API`. The refresh service also preserves `LeadClickCount` because lead
attribution belongs to this application rather than the public YouTube API.

## Common commands

```powershell
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
npm run youtube:test
npm run youtube:refresh
npm run db:test
npm run db:test-dashboard
```

The local `.env` contains the real SQL Server connection values and YouTube API
key and must never be committed. `.env.example` contains only safe placeholders.

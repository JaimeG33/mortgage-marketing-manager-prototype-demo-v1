# Database folder

This folder contains the SQL Server and Prisma foundation used by the Phase 4
YouTube-connected dashboard.

## Current database capabilities

No schema migration was required for Phase 4. The existing seven-model schema
already supports:

- Central content identities in `ContentItem`.
- Platform-specific publications in `PlatformPost`.
- Exact YouTube video IDs in `PlatformPost.ExternalPostId`.
- The resolved channel ID in `SocialAccount.ExternalAccountId`.
- Current video snapshots in `CurrentPostMetrics`.
- Current channel snapshots in `CurrentAccountMetrics`.
- Manually stored application lead values in
  `CurrentPostMetrics.LeadClickCount`.

The current configured YouTube content is:

```text
first-time-buyer-five-things          -> HLEEwG3dNcg
ramsey-show-highlights-p-dcmr6e73u    -> P_DcMR6e73U
```

The primary content item also retains the seeded Instagram demonstration post,
which allows the expandable dashboard charts to compare two platforms.

## Contents

- `schema.prisma` — introspected SQL Server schema.
- `migrations/0_init/migration.sql` — baseline migration for the existing
  database.
- `seedDemoData.ts` — repeatable demonstration/setup data using Prisma upserts.
- `sql/create_mortgage_marketing_prototype.sql` — original SQL Server setup.
- `sql/configure_phase4_ramsey_youtube_content.sql` — transactional manual SSMS
  setup for the two selected YouTube videos.

The shared Prisma client is located at:

```text
services/database/prismaClient.ts
```

The YouTube refresh service is located at:

```text
services/youtube/refreshYouTubeMetrics.ts
```

## Setup options

### Preferred repeatable setup

```powershell
Set-Location D:\ZeTechProjects\mortgage-marketing-manager-prototype-demo-v1
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
```

The seed preserves metric rows whose `MetricsSource` is already `YOUTUBE_API`.
This prevents a normal setup rerun from replacing refreshed YouTube values with
the original simulated snapshot.

### Manual SSMS setup

1. Open SQL Server Management Studio.
2. Connect to the instance containing `MortgageMarketingPrototype`.
3. Open:

```text
D:\ZeTechProjects\mortgage-marketing-manager-prototype-demo-v1\database\sql\configure_phase4_ramsey_youtube_content.sql
```

4. Confirm the first line targets `MortgageMarketingPrototype`.
5. Execute the complete script.
6. Review the verification result set returned at the bottom.

The script is transactional and safe to rerun.

## Refresh behavior

```powershell
npm run youtube:test
npm run youtube:refresh
```

A successful refresh updates:

```text
PlatformPost.PlatformTitle
PlatformPost.PublishedAt
PlatformPost.ExternalPostId
SocialAccount.ExternalAccountId
CurrentPostMetrics.ReachCount
CurrentPostMetrics.LikeCount
CurrentPostMetrics.CommentCount
CurrentPostMetrics.MetricsSource
CurrentPostMetrics.UpdatedAt
CurrentAccountMetrics.*
```

The refresh intentionally preserves:

```text
CurrentPostMetrics.LeadClickCount
```

The public YouTube API does not provide mortgage lead attribution. Shares, saves,
and reactions are stored as SQL `NULL` when YouTube does not expose them.

## Inspecting current platform metrics

Run in SSMS:

```sql
USE MortgageMarketingPrototype;
GO

SELECT
    ci.ContentKey,
    ci.Title AS ContentTitle,
    sp.PlatformCode,
    pp.ExternalPostId,
    m.ReachCount,
    m.LikeCount,
    m.CommentCount,
    m.ShareCount,
    m.SaveCount,
    m.ReactionCount,
    m.LeadClickCount,
    m.MetricsSource,
    m.UpdatedAt
FROM dbo.CurrentPostMetrics AS m
INNER JOIN dbo.PlatformPost AS pp
    ON pp.PlatformPostId = m.PlatformPostId
INNER JOIN dbo.ContentItem AS ci
    ON ci.ContentItemId = pp.ContentItemId
INNER JOIN dbo.SocialAccount AS sa
    ON sa.SocialAccountId = pp.SocialAccountId
INNER JOIN dbo.SocialPlatform AS sp
    ON sp.PlatformId = sa.PlatformId
ORDER BY ci.ContentItemId, pp.PlatformPostId;
GO
```

## Editing placeholder lead values

Leads are currently stored manually in `dbo.CurrentPostMetrics.LeadClickCount`.
For example, this changes the first Ramsey video to five stored leads:

```sql
USE MortgageMarketingPrototype;
GO

UPDATE m
SET
    m.LeadClickCount = 5,
    m.UpdatedAt = SYSUTCDATETIME()
FROM dbo.CurrentPostMetrics AS m
INNER JOIN dbo.PlatformPost AS pp
    ON pp.PlatformPostId = m.PlatformPostId
WHERE pp.ExternalPostId = N'HLEEwG3dNcg';
GO
```

Refresh the browser after editing. `npm run youtube:refresh` will preserve the new
lead value. Lead values will eventually be replaced by tracked application events
rather than manual updates.

## Inspecting stored channel metrics

```sql
USE MortgageMarketingPrototype;
GO

SELECT
    sa.DisplayName,
    sa.ExternalAccountId,
    cam.AudienceCount,
    cam.AudienceMetricType,
    cam.TotalViewCount,
    cam.ContentCount,
    cam.MetricsSource,
    cam.UpdatedAt
FROM dbo.CurrentAccountMetrics AS cam
INNER JOIN dbo.SocialAccount AS sa
    ON sa.SocialAccountId = cam.SocialAccountId
ORDER BY sa.SocialAccountId;
GO
```

These channel totals are stored successfully but are not yet prominently shown
on the dashboard. Displaying them is planned for the next phase.

## Common validation commands

```powershell
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
npm run youtube:test
npm run youtube:refresh
npm run db:test
npm run db:test-dashboard
npm run lint
npm run build
```

The local `.env` contains the real SQL Server connection values and YouTube API
key and must never be committed. `.env.example` contains safe placeholders only.

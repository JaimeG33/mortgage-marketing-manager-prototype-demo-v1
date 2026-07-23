# Database folder

This folder contains the completed SQL Server and Prisma foundation used by the
Phase 3 database-powered dashboard.

## Contents

- `schema.prisma` — the introspected seven-model SQL Server schema.
- `migrations/0_init/migration.sql` — the baseline migration for the existing
  database.
- `seedDemoData.ts` — repeatable demonstration data created with Prisma upserts.
- `sql/create_mortgage_marketing_prototype.sql` — the original SQL Server setup
  script.

The shared Prisma client is located at:

```text
services/database/prismaClient.ts
```

The dashboard query and mapping service is located at:

```text
services/dashboard/getDashboardData.ts
```

Independent tests are located at:

```text
scripts/testDatabaseConnection.ts
scripts/testDashboardData.ts
```

## Common commands

```powershell
npm run db:generate
npx prisma validate
npx prisma migrate status
npm run db:seed
npm run db:test
npm run db:test-dashboard
```

The local `.env` contains the real SQL Server connection values and must never be
committed. `.env.example` contains only placeholders that are safe to share.

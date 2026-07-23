# Database folder

This folder contains the completed Phase 2 SQL Server and Prisma foundation.

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

The independent database test is located at:

```text
scripts/testDatabaseConnection.ts
```

## Common commands

```powershell
npx prisma generate
npx prisma validate
npx prisma migrate status
npx prisma db seed
npx tsx scripts/testDatabaseConnection.ts
```

The local `.env` contains the real SQL Server connection values and must never be
committed. `.env.example` contains only placeholders that are safe to share.

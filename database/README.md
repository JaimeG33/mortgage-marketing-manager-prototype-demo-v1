# Database folder

This folder reserves the database layer for the next development phase.

Planned responsibilities:

- Define the SQL Server schema with Prisma.
- Store the central content identifier shared by matching social posts.
- Store social account and platform-post URLs/IDs.
- Store current manually entered Instagram analytics.
- Seed reproducible demonstration records for team members.

Phase 1 does not connect to a database yet. Do not run Prisma commands until the
required packages and `DATABASE_URL` setup are added in Phase 2.

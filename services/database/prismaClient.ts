import "dotenv/config";

import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../../generated/prisma/client";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.DB_PORT ?? "1433");

if (!Number.isInteger(port)) {
  throw new Error("DB_PORT must be a valid integer.");
}

const adapter = new PrismaMssql({
  server: requireEnvironmentVariable("DB_HOST"),
  port,
  database: requireEnvironmentVariable("DB_NAME"),
  user: requireEnvironmentVariable("DB_USER"),
  password: requireEnvironmentVariable("DB_PASSWORD"),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
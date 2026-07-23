import "dotenv/config";

import { spawnSync } from "node:child_process";

interface SetupStep {
  label: string;
  script: string;
}

const includeYouTubeRefresh = process.argv.includes("--youtube");
const childEnvironment: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: buildDatabaseUrl(),
};

const steps: SetupStep[] = [
  { label: "Create database and application login", script: "db:bootstrap" },
  { label: "Generate Prisma client", script: "db:generate" },
  { label: "Apply committed database migrations", script: "db:migrate" },
  { label: "Populate committed demonstration data", script: "db:seed" },
  { label: "Test database connection", script: "db:test" },
  { label: "Test dashboard data", script: "db:test-dashboard" },
];

if (includeYouTubeRefresh) {
  steps.push(
    { label: "Test YouTube Data API", script: "youtube:test" },
    { label: "Refresh public YouTube metrics", script: "youtube:refresh" },
  );
}

function main(): void {
  for (const [index, step] of steps.entries()) {
    console.log(`\n[${index + 1}/${steps.length}] ${step.label}`);
    runNpmScript(step.script);
  }

  console.log("\nProject setup completed successfully.");

  if (!includeYouTubeRefresh) {
    console.log(
      "Run `npm run youtube:refresh` later to replace seeded YouTube snapshots with current public metrics.",
    );
  }

  console.log("Start the web application with `npm run dev`.");
}

function runNpmScript(script: string): void {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", script], {
    env: childEnvironment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Setup stopped because npm run ${script} failed.`);
  }
}

function buildDatabaseUrl(): string {
  const port = requireEnvironmentVariable("DB_PORT");

  if (!/^\d+$/.test(port)) {
    throw new Error("DB_PORT must contain only digits.");
  }

  return [
    `sqlserver://${requireEnvironmentVariable("DB_HOST")}:${port}`,
    `database=${escapeSqlServerConnectionValue(requireEnvironmentVariable("DB_NAME"))}`,
    `user=${escapeSqlServerConnectionValue(requireEnvironmentVariable("DB_USER"))}`,
    `password=${escapeSqlServerConnectionValue(requireEnvironmentVariable("DB_PASSWORD"))}`,
    "encrypt=true",
    "trustServerCertificate=true",
    "schema=dbo",
  ].join(";");
}

function escapeSqlServerConnectionValue(value: string): string {
  return `{${value.replaceAll("}", "}}")}}`;
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown setup error.";
  console.error(`\n${message}`);
  process.exitCode = 1;
}

import { getEngagements } from "../services/analytics/combineMetrics";
import type {
  DashboardData,
  PlatformPostMetrics,
} from "../services/analytics/types";
import {
  DEFAULT_DASHBOARD_CONTENT_KEY,
  getDashboardData,
} from "../services/dashboard/getDashboardData";
import { prisma } from "../services/database/prismaClient";

const SECONDARY_CONTENT_KEY = "ramsey-show-highlights-p-dcmr6e73u";

async function main(): Promise<void> {
  const primaryData = await requireDashboardData(
    DEFAULT_DASHBOARD_CONTENT_KEY,
  );
  const secondaryData = await requireDashboardData(SECONDARY_CONTENT_KEY);

  validateDashboardData(primaryData);
  validateDashboardData(secondaryData);

  assert(
    primaryData.platformMetrics.length === 2,
    `Expected 2 primary platform rows, found ${primaryData.platformMetrics.length}.`,
  );
  assert(
    secondaryData.platformMetrics.length === 1,
    `Expected 1 secondary platform row, found ${secondaryData.platformMetrics.length}.`,
  );

  assertVideoIsLinked(primaryData, "HLEEwG3dNcg");
  assertVideoIsLinked(secondaryData, "P_DcMR6e73U");
  assert(
    primaryData.platformMetrics.some((row) => row.platform === "Instagram"),
    "The primary Instagram platform row is missing.",
  );
  assert(
    primaryData.combinedMetrics.leads === 27,
    `Expected the primary content to preserve 27 lead clicks, found ${primaryData.combinedMetrics.leads}.`,
  );
  assert(
    secondaryData.combinedMetrics.leads === 0,
    `Expected the secondary content to have 0 lead clicks, found ${secondaryData.combinedMetrics.leads}.`,
  );

  console.log("Dashboard data test successful.");
  printSummary(primaryData);
  printSummary(secondaryData);
}

async function requireDashboardData(contentKey: string): Promise<DashboardData> {
  const dashboardData = await getDashboardData(contentKey);

  assert(dashboardData !== null, `Missing active content item: ${contentKey}`);
  return dashboardData;
}

function validateDashboardData(dashboardData: DashboardData): void {
  assert(dashboardData.contentTitle.trim(), "Content title cannot be blank.");

  for (const row of dashboardData.platformMetrics) {
    validatePlatformRow(row);
  }

  const expectedReach = dashboardData.platformMetrics.reduce(
    (total, row) => total + row.reach,
    0,
  );
  const expectedEngagements = dashboardData.platformMetrics.reduce(
    (total, row) => total + getEngagements(row),
    0,
  );
  const expectedLeads = dashboardData.platformMetrics.reduce(
    (total, row) => total + row.leads,
    0,
  );

  assert(
    dashboardData.combinedMetrics.reach === expectedReach,
    `Combined reach mismatch for ${dashboardData.contentKey}.`,
  );
  assert(
    dashboardData.combinedMetrics.engagements === expectedEngagements,
    `Combined engagement mismatch for ${dashboardData.contentKey}.`,
  );
  assert(
    dashboardData.combinedMetrics.leads === expectedLeads,
    `Combined lead mismatch for ${dashboardData.contentKey}.`,
  );
}

function validatePlatformRow(row: PlatformPostMetrics): void {
  const values = [
    row.reach,
    row.likes,
    row.comments,
    row.shares,
    row.saves,
    row.reactions,
    row.leads,
  ];

  for (const value of values) {
    assert(
      Number.isSafeInteger(value) && value >= 0,
      `${row.platform} contains an invalid numeric metric.`,
    );
  }

  if (row.platform === "YouTube") {
    assert(
      row.source === "simulated" || row.source === "youtube-api",
      `Unexpected YouTube source: ${row.source}`,
    );
  }

  if (row.platform === "Instagram") {
    assert(row.source === "manual", "Instagram should remain manual in Phase 4.");
  }
}

function assertVideoIsLinked(
  dashboardData: DashboardData,
  expectedVideoId: string,
): void {
  assert(
    dashboardData.platformMetrics.some(
      (row) =>
        row.platform === "YouTube" && row.externalPostId === expectedVideoId,
    ),
    `Content ${dashboardData.contentKey} is not linked to YouTube video ${expectedVideoId}.`,
  );
}

function printSummary(dashboardData: DashboardData): void {
  console.log("");
  console.log(`Content: ${dashboardData.contentKey}`);
  console.log(`Title: ${dashboardData.contentTitle}`);
  console.log(`Platform rows: ${dashboardData.platformMetrics.length}`);
  console.log(`Combined reach: ${dashboardData.combinedMetrics.reach}`);
  console.log(
    `Combined engagements: ${dashboardData.combinedMetrics.engagements}`,
  );
  console.log(`Combined leads: ${dashboardData.combinedMetrics.leads}`);
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main()
  .catch((error: unknown) => {
    console.error("Dashboard data test failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  DEFAULT_DASHBOARD_CONTENT_KEY,
  getDashboardData,
} from "../services/dashboard/getDashboardData";
import { prisma } from "../services/database/prismaClient";

async function main(): Promise<void> {
  const dashboardData = await getDashboardData();

  assert(
    dashboardData !== null,
    `Missing active content item: ${DEFAULT_DASHBOARD_CONTENT_KEY}`,
  );
  assert(
    dashboardData.contentTitle ===
      "5 Things Every First-Time Buyer Should Know",
    "Unexpected dashboard content title.",
  );
  assert(
    dashboardData.platformMetrics.length === 2,
    `Expected 2 platform rows, found ${dashboardData.platformMetrics.length}.`,
  );
  assert(
    dashboardData.combinedMetrics.reach === 18_600,
    `Expected combined reach 18600, found ${dashboardData.combinedMetrics.reach}.`,
  );
  assert(
    dashboardData.combinedMetrics.engagements === 1_036,
    `Expected 1036 engagements, found ${dashboardData.combinedMetrics.engagements}.`,
  );
  assert(
    dashboardData.combinedMetrics.leads === 27,
    `Expected 27 leads, found ${dashboardData.combinedMetrics.leads}.`,
  );

  const platforms = new Set(
    dashboardData.platformMetrics.map((row) => row.platform),
  );

  assert(platforms.has("YouTube"), "YouTube platform row is missing.");
  assert(platforms.has("Instagram"), "Instagram platform row is missing.");

  console.log("Dashboard data test successful.");
  console.log(`Content: ${dashboardData.contentTitle}`);
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

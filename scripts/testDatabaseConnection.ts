import { prisma } from "../services/database/prismaClient";

async function main(): Promise<void> {
  const platforms = await prisma.socialPlatform.findMany({
    orderBy: {
      PlatformId: "asc",
    },
  });

  const contentItems = await prisma.contentItem.findMany({
    include: {
      Campaign: true,
      PlatformPost: {
        include: {
          SocialAccount: {
            include: {
              SocialPlatform: true,
            },
          },
          CurrentPostMetrics: true,
        },
      },
    },
  });

  console.log("Database connection successful.");
  console.log(`Social platforms found: ${platforms.length}`);
  console.table(
    platforms.map((platform) => ({
      id: platform.PlatformId,
      code: platform.PlatformCode,
      name: platform.DisplayName,
    })),
  );

  console.log(`Content items found: ${contentItems.length}`);
  console.dir(contentItems, { depth: null });
}

main()
  .catch((error: unknown) => {
    console.error("Database test failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
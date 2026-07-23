import { prisma } from "../services/database/prismaClient";
import { refreshYouTubeMetrics } from "../services/youtube/refreshYouTubeMetrics";

async function main(): Promise<void> {
  const results = await refreshYouTubeMetrics();

  console.log(`Refreshed ${results.length} YouTube post(s).`);

  for (const result of results) {
    console.log("");
    console.log(`Content: ${result.contentKey}`);
    console.log(`Video: ${result.title} (${result.videoId})`);
    console.log(`Views: ${result.reach}`);
    console.log(
      `Likes: ${result.likes === null ? "Unavailable" : result.likes.toString()}`,
    );
    console.log(
      `Comments: ${result.comments === null ? "Unavailable" : result.comments.toString()}`,
    );
    console.log(`Lead clicks preserved: ${result.leadClicksPreserved}`);
    console.log(`Updated: ${result.refreshedAt.toISOString()}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("YouTube metrics refresh failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

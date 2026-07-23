import { prisma } from "../services/database/prismaClient";
import {
  getPublicYouTubeChannels,
  getPublicYouTubeVideos,
} from "../services/youtube/youtubeDataApi";
import { getYouTubeRefreshTargets } from "../services/youtube/refreshYouTubeMetrics";

const EXPECTED_VIDEO_IDS = new Set(["HLEEwG3dNcg", "P_DcMR6e73U"]);

async function main(): Promise<void> {
  const targets = await getYouTubeRefreshTargets();
  const configuredVideoIds = new Set(targets.map((target) => target.videoId));

  for (const expectedVideoId of EXPECTED_VIDEO_IDS) {
    assert(
      configuredVideoIds.has(expectedVideoId),
      `The database is missing configured YouTube video ${expectedVideoId}.`,
    );
  }

  const videos = await getPublicYouTubeVideos([...configuredVideoIds]);
  assert(
    videos.length === configuredVideoIds.size,
    "The YouTube API did not return every configured video.",
  );

  const channels = await getPublicYouTubeChannels([
    ...new Set(videos.map((video) => video.channelId)),
  ]);
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  console.log("YouTube Data API test successful.");

  for (const video of videos) {
    const channel = channelById.get(video.channelId);
    assert(channel, `Channel ${video.channelId} was not returned.`);

    console.log("");
    console.log(`Video ID: ${video.id}`);
    console.log(`Title: ${video.title}`);
    console.log(`Channel: ${channel.title} (${channel.id})`);
    console.log(`Published: ${video.publishedAt.toISOString()}`);
    console.log(`Views: ${video.viewCount}`);
    console.log(`Likes: ${formatOptionalCount(video.likeCount)}`);
    console.log(`Comments: ${formatOptionalCount(video.commentCount)}`);
  }
}

function formatOptionalCount(value: bigint | null): string {
  return value === null ? "Unavailable" : value.toString();
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
    console.error("YouTube Data API test failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

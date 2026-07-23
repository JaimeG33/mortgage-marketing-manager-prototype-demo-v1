import { prisma } from "../database/prismaClient";
import {
  getPublicYouTubeChannels,
  getPublicYouTubeVideos,
  YouTubeDataApiError,
} from "./youtubeDataApi";
import type { PublicYouTubeChannel, PublicYouTubeVideo } from "./types";

export interface YouTubeRefreshTarget {
  platformPostId: number;
  contentItemId: number;
  contentKey: string;
  socialAccountId: number;
  videoId: string;
  existingLeadClicks: number;
}

export interface YouTubeRefreshResult {
  platformPostId: number;
  contentKey: string;
  videoId: string;
  title: string;
  channelId: string;
  reach: bigint;
  likes: bigint | null;
  comments: bigint | null;
  leadClicksPreserved: number;
  refreshedAt: Date;
}

export async function getYouTubeRefreshTargets(): Promise<
  YouTubeRefreshTarget[]
> {
  const posts = await prisma.platformPost.findMany({
    where: {
      IsActive: true,
      ExternalPostId: {
        not: null,
      },
    },
    orderBy: {
      PlatformPostId: "asc",
    },
    include: {
      ContentItem: true,
      CurrentPostMetrics: true,
      SocialAccount: {
        include: {
          SocialPlatform: true,
        },
      },
    },
  });

  return posts.flatMap((post): YouTubeRefreshTarget[] => {
    if (
      !post.ContentItem.IsActive ||
      !post.SocialAccount.IsActive ||
      !post.SocialAccount.SocialPlatform.IsActive ||
      post.SocialAccount.SocialPlatform.PlatformCode.toUpperCase() !== "YOUTUBE"
    ) {
      return [];
    }

    const videoId = post.ExternalPostId?.trim();
    if (!videoId) {
      return [];
    }

    return [
      {
        platformPostId: post.PlatformPostId,
        contentItemId: post.ContentItemId,
        contentKey: post.ContentItem.ContentKey,
        socialAccountId: post.SocialAccountId,
        videoId,
        existingLeadClicks: post.CurrentPostMetrics?.LeadClickCount ?? 0,
      },
    ];
  });
}

export async function refreshYouTubeMetrics(): Promise<YouTubeRefreshResult[]> {
  const targets = await getYouTubeRefreshTargets();

  if (targets.length === 0) {
    throw new YouTubeDataApiError(
      "No active YouTube PlatformPost records with video IDs were found.",
    );
  }

  const videos = await getPublicYouTubeVideos(
    targets.map((target) => target.videoId),
  );
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const channelIdByAccountId = buildChannelIdByAccountId(targets, videoById);
  const channels = await getPublicYouTubeChannels([
    ...new Set(channelIdByAccountId.values()),
  ]);
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));
  const youtubePostCountByContentItem = countPostsByContentItem(targets);
  const refreshedAt = new Date();

  await prisma.$transaction(async (transaction) => {
    for (const target of targets) {
      const video = requireVideo(videoById, target.videoId);

      await transaction.platformPost.update({
        where: {
          PlatformPostId: target.platformPostId,
        },
        data: {
          ExternalPostId: video.id,
          PostUrl: `https://www.youtube.com/watch?v=${video.id}`,
          PlatformTitle: video.title,
          PublishedAt: video.publishedAt,
          PostFormat: "VIDEO",
          UpdatedAt: refreshedAt,
        },
      });

      await transaction.currentPostMetrics.upsert({
        where: {
          PlatformPostId: target.platformPostId,
        },
        update: {
          ReachCount: video.viewCount,
          ReachMetricType: "VIEWS",
          LikeCount: video.likeCount,
          CommentCount: video.commentCount,
          ShareCount: null,
          SaveCount: null,
          ReactionCount: null,
          LeadClickCount: target.existingLeadClicks,
          MetricsSource: "YOUTUBE_API",
          UpdatedAt: refreshedAt,
        },
        create: {
          PlatformPostId: target.platformPostId,
          ReachCount: video.viewCount,
          ReachMetricType: "VIEWS",
          LikeCount: video.likeCount,
          CommentCount: video.commentCount,
          ShareCount: null,
          SaveCount: null,
          ReactionCount: null,
          LeadClickCount: target.existingLeadClicks,
          MetricsSource: "YOUTUBE_API",
          UpdatedAt: refreshedAt,
        },
      });

      if (youtubePostCountByContentItem.get(target.contentItemId) === 1) {
        await transaction.contentItem.update({
          where: {
            ContentItemId: target.contentItemId,
          },
          data: {
            Title: video.title,
            UpdatedAt: refreshedAt,
          },
        });
      }
    }

    for (const [socialAccountId, channelId] of channelIdByAccountId) {
      const channel = requireChannel(channelById, channelId);

      await transaction.socialAccount.update({
        where: {
          SocialAccountId: socialAccountId,
        },
        data: {
          DisplayName: channel.title,
          ExternalAccountId: channel.id,
          UpdatedAt: refreshedAt,
        },
      });

      await transaction.currentAccountMetrics.upsert({
        where: {
          SocialAccountId: socialAccountId,
        },
        update: {
          AudienceCount: channel.subscriberCount,
          AudienceMetricType: "SUBSCRIBERS",
          TotalViewCount: channel.totalViewCount,
          ContentCount: channel.contentCount,
          MetricsSource: "YOUTUBE_API",
          UpdatedAt: refreshedAt,
        },
        create: {
          SocialAccountId: socialAccountId,
          AudienceCount: channel.subscriberCount,
          AudienceMetricType: "SUBSCRIBERS",
          TotalViewCount: channel.totalViewCount,
          ContentCount: channel.contentCount,
          MetricsSource: "YOUTUBE_API",
          UpdatedAt: refreshedAt,
        },
      });
    }
  });

  return targets.map((target) => {
    const video = requireVideo(videoById, target.videoId);

    return {
      platformPostId: target.platformPostId,
      contentKey: target.contentKey,
      videoId: video.id,
      title: video.title,
      channelId: video.channelId,
      reach: video.viewCount,
      likes: video.likeCount,
      comments: video.commentCount,
      leadClicksPreserved: target.existingLeadClicks,
      refreshedAt,
    };
  });
}

function buildChannelIdByAccountId(
  targets: YouTubeRefreshTarget[],
  videoById: Map<string, PublicYouTubeVideo>,
): Map<number, string> {
  const channelIdByAccountId = new Map<number, string>();

  for (const target of targets) {
    const video = requireVideo(videoById, target.videoId);
    const existingChannelId = channelIdByAccountId.get(target.socialAccountId);

    if (existingChannelId && existingChannelId !== video.channelId) {
      throw new YouTubeDataApiError(
        `YouTube posts assigned to SocialAccount ${target.socialAccountId} belong to different channels.`,
      );
    }

    channelIdByAccountId.set(target.socialAccountId, video.channelId);
  }

  return channelIdByAccountId;
}

function countPostsByContentItem(
  targets: YouTubeRefreshTarget[],
): Map<number, number> {
  const counts = new Map<number, number>();

  for (const target of targets) {
    counts.set(target.contentItemId, (counts.get(target.contentItemId) ?? 0) + 1);
  }

  return counts;
}

function requireVideo(
  videoById: Map<string, PublicYouTubeVideo>,
  videoId: string,
): PublicYouTubeVideo {
  const video = videoById.get(videoId);

  if (!video) {
    throw new YouTubeDataApiError(
      `No normalized YouTube video was found for ${videoId}.`,
    );
  }

  return video;
}

function requireChannel(
  channelById: Map<string, PublicYouTubeChannel>,
  channelId: string,
): PublicYouTubeChannel {
  const channel = channelById.get(channelId);

  if (!channel) {
    throw new YouTubeDataApiError(
      `No normalized YouTube channel was found for ${channelId}.`,
    );
  }

  return channel;
}

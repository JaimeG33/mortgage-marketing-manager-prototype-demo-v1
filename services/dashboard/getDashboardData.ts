import { combineMetrics } from "@/services/analytics/combineMetrics";
import type {
  AnalyticsSource,
  DashboardData,
  PlatformClassName,
  PlatformName,
  PlatformPostMetrics,
} from "@/services/analytics/types";
import { prisma } from "@/services/database/prismaClient";

export const DEFAULT_DASHBOARD_CONTENT_KEY =
  "first-time-buyer-five-things";

interface PlatformPresentation {
  platform: PlatformName;
  platformClassName: PlatformClassName;
}

export async function getDashboardData(
  contentKey = DEFAULT_DASHBOARD_CONTENT_KEY,
): Promise<DashboardData | null> {
  const contentItem = await prisma.contentItem.findUnique({
    where: {
      ContentKey: contentKey,
    },
    include: {
      Campaign: true,
      PlatformPost: {
        where: {
          IsActive: true,
        },
        orderBy: {
          PlatformPostId: "asc",
        },
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

  if (!contentItem?.IsActive) {
    return null;
  }

  const platformMetrics = contentItem.PlatformPost.flatMap(
    (post): PlatformPostMetrics[] => {
      if (
        !post.SocialAccount.IsActive ||
        !post.SocialAccount.SocialPlatform.IsActive
      ) {
        return [];
      }

      const platformPresentation = getPlatformPresentation(
        post.SocialAccount.SocialPlatform.PlatformCode,
      );

      if (!platformPresentation) {
        console.warn(
          `Skipping unsupported platform code: ${post.SocialAccount.SocialPlatform.PlatformCode}`,
        );
        return [];
      }

      const metrics = post.CurrentPostMetrics;
      const source = getAnalyticsSource(metrics?.MetricsSource);

      return [
        {
          ...platformPresentation,
          platformTitle: post.PlatformTitle,
          postUrl: post.PostUrl,
          externalPostId:
            post.ExternalPostId ?? `platform-post-${post.PlatformPostId}`,
          reach: toSafeNumber(
            metrics?.ReachCount,
            `${platformPresentation.platform} reach`,
          ),
          likes: toSafeNumber(
            metrics?.LikeCount,
            `${platformPresentation.platform} likes`,
          ),
          comments: toSafeNumber(
            metrics?.CommentCount,
            `${platformPresentation.platform} comments`,
          ),
          shares: toSafeNumber(
            metrics?.ShareCount,
            `${platformPresentation.platform} shares`,
          ),
          saves: toSafeNumber(
            metrics?.SaveCount,
            `${platformPresentation.platform} saves`,
          ),
          reactions: toSafeNumber(
            metrics?.ReactionCount,
            `${platformPresentation.platform} reactions`,
          ),
          leads: toSafeNumber(
            metrics?.LeadClickCount,
            `${platformPresentation.platform} leads`,
          ),
          source,
          updatedLabel: getUpdatedLabel(source, metrics?.UpdatedAt),
        },
      ];
    },
  );

  return {
    contentKey: contentItem.ContentKey,
    contentTitle: contentItem.Title,
    contentDescription:
      contentItem.Description ?? "No content description is available.",
    contentTypeLabel: formatContentType(contentItem.ContentType),
    campaignName: contentItem.Campaign?.Name ?? null,
    platformMetrics,
    combinedMetrics: combineMetrics(platformMetrics),
  };
}

function getPlatformPresentation(
  platformCode: string,
): PlatformPresentation | null {
  switch (platformCode.toUpperCase()) {
    case "YOUTUBE":
      return {
        platform: "YouTube",
        platformClassName: "youtube",
      };
    case "INSTAGRAM":
      return {
        platform: "Instagram",
        platformClassName: "instagram",
      };
    default:
      return null;
  }
}

function getAnalyticsSource(
  metricsSource: string | null | undefined,
): AnalyticsSource {
  switch (metricsSource?.toUpperCase()) {
    case "YOUTUBE_API":
      return "youtube-api";
    case "SIMULATED":
      return "simulated";
    case "MANUAL":
      return "manual";
    default:
      return "unavailable";
  }
}

function getUpdatedLabel(
  source: AnalyticsSource,
  updatedAt: Date | null | undefined,
): string {
  if (!updatedAt || source === "unavailable") {
    return "Metrics unavailable";
  }

  const sourceLabel = getSourceLabel(source);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(updatedAt);

  return `${sourceLabel} updated ${dateLabel}`;
}

function getSourceLabel(source: AnalyticsSource): string {
  switch (source) {
    case "youtube-api":
      return "YouTube API";
    case "simulated":
      return "Simulated metrics";
    case "manual":
      return "Manual metrics";
    default:
      return "Metrics";
  }
}

function formatContentType(contentType: string): string {
  return contentType.replaceAll("_", " ").trim().toUpperCase();
}

function toSafeNumber(
  value: bigint | number | null | undefined,
  fieldName: string,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const numericValue = typeof value === "bigint" ? Number(value) : value;

  if (!Number.isSafeInteger(numericValue)) {
    throw new RangeError(
      `${fieldName} is outside JavaScript's safe integer range.`,
    );
  }

  return numericValue;
}

import type { PlatformPostMetrics } from "./types";

/**
 * Legacy deterministic provider retained as the future YouTube API boundary.
 * Phase 3 reads the dashboard from SQL Server instead of calling this function.
 */
export function getYouTubeMetrics(): PlatformPostMetrics {
  return {
    platform: "YouTube",
    platformClassName: "youtube",
    postUrl: null,
    externalPostId: "demo-youtube-post",
    reach: 11_800,
    likes: 520,
    comments: 72,
    shares: 32,
    saves: 0,
    reactions: 0,
    leads: 18,
    source: "simulated",
    updatedLabel: "YouTube demo provider",
  };
}

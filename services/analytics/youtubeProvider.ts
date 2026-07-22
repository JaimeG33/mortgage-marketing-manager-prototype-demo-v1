import type { PlatformPostMetrics } from "./types";

/**
 * Phase 1 uses deterministic demo values so the dashboard can demonstrate
 * the provider boundary without requiring a YouTube API key yet.
 *
 * In Phase 2, this function can be replaced with a server-side request to the
 * YouTube Data API while keeping the same PlatformPostMetrics return shape.
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
    leads: 18,
    source: "simulated",
    updatedLabel: "YouTube demo provider",
  };
}

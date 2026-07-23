import type { PlatformPostMetrics } from "./types";

/**
 * Legacy deterministic provider retained as the future manual-entry boundary.
 * Phase 3 reads the dashboard from SQL Server instead of calling this function.
 */
export function getManualInstagramMetrics(): PlatformPostMetrics {
  return {
    platform: "Instagram",
    platformClassName: "instagram",
    postUrl: null,
    externalPostId: "demo-instagram-post",
    reach: 6_800,
    likes: 340,
    comments: 48,
    shares: 24,
    saves: 0,
    reactions: 0,
    leads: 9,
    source: "manual",
    updatedLabel: "Manually entered demo data",
  };
}

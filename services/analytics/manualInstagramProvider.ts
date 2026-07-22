import type { PlatformPostMetrics } from "./types";

/**
 * Represents the manual analytics provider planned for the first database
 * iteration. The values are simulated during Phase 1 and will later come from
 * a manually maintained SQL Server record.
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
    leads: 9,
    source: "manual",
    updatedLabel: "Manually entered demo data",
  };
}

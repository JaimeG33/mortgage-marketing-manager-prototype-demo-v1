import type { CombinedMetrics, PlatformPostMetrics } from "./types";

export function getEngagements(metrics: PlatformPostMetrics): number {
  return metrics.likes + metrics.comments + metrics.shares;
}

export function combineMetrics(
  platformMetrics: PlatformPostMetrics[],
): CombinedMetrics {
  const totals = platformMetrics.reduce(
    (current, platform) => ({
      reach: current.reach + platform.reach,
      engagements: current.engagements + getEngagements(platform),
      leads: current.leads + platform.leads,
    }),
    { reach: 0, engagements: 0, leads: 0 },
  );

  return {
    ...totals,
    engagementRate:
      totals.reach === 0 ? 0 : (totals.engagements / totals.reach) * 100,
    leadRate: totals.reach === 0 ? 0 : (totals.leads / totals.reach) * 100,
  };
}

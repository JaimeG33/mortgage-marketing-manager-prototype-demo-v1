import { getEngagements } from "@/services/analytics/combineMetrics";
import type { PlatformPostMetrics } from "@/services/analytics/types";

interface PlatformBreakdownProps {
  platformMetrics: PlatformPostMetrics[];
}

export function PlatformBreakdown({
  platformMetrics,
}: PlatformBreakdownProps) {
  return (
    <div className="platform-list">
      {platformMetrics.map((row) => (
        <div className="platform-row" key={row.externalPostId}>
          <span className={`platform-logo ${row.platformClassName}`}>
            {row.platform.slice(0, 1)}
          </span>
          <div className="platform-name">
            <strong>{row.platform}</strong>
            <small>{row.updatedLabel}</small>
          </div>
          <span>{formatCompactNumber(row.reach)} reach</span>
          <span>{formatWholeNumber(getEngagements(row))} engagements</span>
          <span>{formatWholeNumber(row.leads)} leads</span>
          {row.postUrl ? (
            <a href={row.postUrl} target="_blank" rel="noreferrer">
              Open post
            </a>
          ) : (
            <button type="button" disabled title="A real post URL will be stored in the database later.">
              Link pending
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function formatWholeNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

import { getEngagements } from "@/services/analytics/combineMetrics";
import type { PlatformPostMetrics } from "@/services/analytics/types";

interface PlatformBreakdownProps {
  platformMetrics: PlatformPostMetrics[];
}

export function PlatformBreakdown({
  platformMetrics,
}: PlatformBreakdownProps) {
  if (platformMetrics.length === 0) {
    return (
      <p className="description">
        No active supported platform posts are available for this content.
      </p>
    );
  }

  return (
    <div className="platform-list">
      {platformMetrics.map((row) => (
        <div
          className="platform-row"
          key={`${row.platform}-${row.externalPostId}`}
        >
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
            <button
              type="button"
              disabled
              title="No post URL is stored for this platform record."
            >
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

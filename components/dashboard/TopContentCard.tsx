import type {
  CombinedMetrics,
  PlatformPostMetrics,
} from "@/services/analytics/types";
import { PlatformBreakdown } from "./PlatformBreakdown";

interface TopContentCardProps {
  title: string;
  description: string;
  combinedMetrics: CombinedMetrics;
  platformMetrics: PlatformPostMetrics[];
}

export function TopContentCard({
  title,
  description,
  combinedMetrics,
  platformMetrics,
}: TopContentCardProps) {
  return (
    <section className="content-section">
      <div className="panel-heading">
        <div>
          <h2>Top Performing Content</h2>
          <p>One central content item tracked across multiple platforms</p>
        </div>
        <button className="link-button" type="button" disabled>
          Details coming soon
        </button>
      </div>

      <article className="content-card">
        <div className="video-preview">
          <span>SHORT VIDEO</span>
          <div className="play" aria-hidden="true">
            ▶
          </div>
          <strong>{title}</strong>
        </div>

        <div className="content-info">
          <p className="eyebrow">First-time buyer series</p>
          <h2>{title}</h2>
          <p className="description">{description}</p>

          <div className="mini-grid">
            <Mini
              label="Combined reach"
              value={formatCompactNumber(combinedMetrics.reach)}
            />
            <Mini
              label="Engagements"
              value={formatWholeNumber(combinedMetrics.engagements)}
            />
            <Mini
              label="Leads"
              value={formatWholeNumber(combinedMetrics.leads)}
            />
          </div>

          <PlatformBreakdown platformMetrics={platformMetrics} />
        </div>
      </article>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
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

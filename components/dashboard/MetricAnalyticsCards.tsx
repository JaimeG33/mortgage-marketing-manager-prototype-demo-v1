"use client";

import { useState } from "react";

import type {
  CombinedMetrics,
  PlatformPostMetrics,
} from "@/services/analytics/types";

type MetricKey = "reach" | "engagements" | "leads";

interface MetricAnalyticsCardsProps {
  combinedMetrics: CombinedMetrics;
  platformMetrics: PlatformPostMetrics[];
}

interface MetricButtonProps {
  metric: MetricKey;
  icon: string;
  title: string;
  value: string;
  change: string;
  tone: "blue" | "purple" | "green";
  activeMetric: MetricKey | null;
  onSelect: (metric: MetricKey) => void;
}

interface ComparisonEntry {
  key: string;
  label: string;
  value: number;
  platformClassName: PlatformPostMetrics["platformClassName"];
  sourceLabel: string;
}

export function MetricAnalyticsCards({
  combinedMetrics,
  platformMetrics,
}: MetricAnalyticsCardsProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);

  function handleSelect(metric: MetricKey): void {
    setActiveMetric((current) => (current === metric ? null : metric));
  }

  return (
    <section className="metric-analytics" aria-label="Interactive metric details">
      <div className="metric-grid">
        <MetricButton
          metric="reach"
          icon="◉"
          title="Reach"
          value={formatCompactNumber(combinedMetrics.reach)}
          change={`Across ${platformMetrics.length} linked posts`}
          tone="blue"
          activeMetric={activeMetric}
          onSelect={handleSelect}
        />
        <MetricButton
          metric="engagements"
          icon="♡"
          title="Engagements"
          value={formatWholeNumber(combinedMetrics.engagements)}
          change="Uses available platform engagement metrics"
          tone="purple"
          activeMetric={activeMetric}
          onSelect={handleSelect}
        />
        <MetricButton
          metric="leads"
          icon="♟"
          title="Leads"
          value={formatWholeNumber(combinedMetrics.leads)}
          change="Stored link-click total"
          tone="green"
          activeMetric={activeMetric}
          onSelect={handleSelect}
        />
      </div>

      {activeMetric ? (
        <MetricDetailPanel
          metric={activeMetric}
          platformMetrics={platformMetrics}
        />
      ) : null}
    </section>
  );
}

function MetricButton({
  metric,
  icon,
  title,
  value,
  change,
  tone,
  activeMetric,
  onSelect,
}: MetricButtonProps) {
  const isActive = activeMetric === metric;

  return (
    <button
      className={`metric-card metric-card-button${isActive ? " active" : ""}`}
      type="button"
      aria-expanded={isActive}
      aria-controls="metric-detail-panel"
      onClick={() => onSelect(metric)}
    >
      <span className={`metric-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span className="metric-card-copy">
        <span className="metric-card-title">{title}</span>
        <strong>{value}</strong>
        <span className="positive">↗ {change}</span>
      </span>
      <span className="metric-expand-icon" aria-hidden="true">
        {isActive ? "−" : "+"}
      </span>
    </button>
  );
}

function MetricDetailPanel({
  metric,
  platformMetrics,
}: {
  metric: MetricKey;
  platformMetrics: PlatformPostMetrics[];
}) {
  if (metric === "engagements") {
    return <EngagementDetails platformMetrics={platformMetrics} />;
  }

  const isReach = metric === "reach";
  const entries = platformMetrics.map((row) => ({
    key: `${row.platform}-${row.externalPostId}`,
    label: row.platform,
    value: isReach ? row.reach : row.leads,
    platformClassName: row.platformClassName,
    sourceLabel: getSourceLabel(row),
  }));

  return (
    <div
      className={`metric-detail-panel ${metric}`}
      id="metric-detail-panel"
      role="region"
      aria-live="polite"
    >
      <div className="metric-detail-heading">
        <div>
          <p className="eyebrow">Platform comparison</p>
          <h2>{isReach ? "Reach by platform" : "Leads by platform"}</h2>
        </div>
        <p>
          {isReach
            ? "Views or the closest available platform reach equivalent."
            : "Temporary stored lead-click values until attribution tracking is implemented."}
        </p>
      </div>
      <ComparisonBars entries={entries} />
    </div>
  );
}

function EngagementDetails({
  platformMetrics,
}: {
  platformMetrics: PlatformPostMetrics[];
}) {
  return (
    <div
      className="metric-detail-panel engagements"
      id="metric-detail-panel"
      role="region"
      aria-live="polite"
    >
      <div className="metric-detail-heading">
        <div>
          <p className="eyebrow">Platform breakdown</p>
          <h2>Engagements by type</h2>
        </div>
        <p>
          YouTube uses publicly available API values. Unavailable YouTube fields
          remain stored as null and appear as zero in this prototype chart.
        </p>
      </div>

      <div className="engagement-platform-grid">
        {platformMetrics.map((row) => {
          const entries: ComparisonEntry[] = [
            { label: "Likes", value: row.likes },
            { label: "Comments", value: row.comments },
            { label: "Shares", value: row.shares },
            { label: "Saves", value: row.saves },
            { label: "Reactions", value: row.reactions },
          ].map((entry) => ({
            ...entry,
            key: `${row.externalPostId}-${entry.label}`,
            platformClassName: row.platformClassName,
            sourceLabel: "",
          }));

          return (
            <article
              className="engagement-platform-card"
              key={`${row.platform}-${row.externalPostId}`}
            >
              <div className="engagement-platform-heading">
                <span
                  className={`platform-logo ${row.platformClassName}`}
                  aria-hidden="true"
                >
                  {row.platform.slice(0, 1)}
                </span>
                <div>
                  <h3>{row.platform}</h3>
                  <small>{getSourceLabel(row)}</small>
                </div>
              </div>
              <ComparisonBars entries={entries} compact />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonBars({
  entries,
  compact = false,
}: {
  entries: ComparisonEntry[];
  compact?: boolean;
}) {
  const maxValue = Math.max(1, ...entries.map((entry) => entry.value));

  return (
    <div className={`comparison-bars${compact ? " compact" : ""}`}>
      {entries.map((entry) => {
        const width = entry.value === 0 ? 0 : (entry.value / maxValue) * 100;

        return (
          <div className="comparison-row" key={entry.key}>
            <div className="comparison-label">
              <strong>{entry.label}</strong>
              {entry.sourceLabel ? <small>{entry.sourceLabel}</small> : null}
            </div>
            <div className="comparison-track" aria-hidden="true">
              <span
                className={entry.platformClassName}
                style={{ width: `${width}%` }}
              />
            </div>
            <strong className="comparison-value">
              {formatWholeNumber(entry.value)}
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function getSourceLabel(row: PlatformPostMetrics): string {
  switch (row.source) {
    case "youtube-api":
      return "Live public YouTube data";
    case "manual":
      return "Manual demonstration data";
    case "simulated":
      return "Simulated demonstration data";
    default:
      return "Metrics unavailable";
  }
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

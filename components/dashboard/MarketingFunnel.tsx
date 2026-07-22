import type { CombinedMetrics } from "@/services/analytics/types";

interface MarketingFunnelProps {
  metrics: CombinedMetrics;
}

export function MarketingFunnel({ metrics }: MarketingFunnelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Your Marketing Funnel</h2>
          <p>Combined results from connected platforms</p>
        </div>
        <span className="updated">Phase 1 demo data</span>
      </div>

      <div className="funnel">
        <FunnelStep
          label="Reach"
          value={formatWholeNumber(metrics.reach)}
          tone="blue"
        />
        <b aria-hidden="true">→</b>
        <FunnelStep
          label="Engagements"
          value={formatWholeNumber(metrics.engagements)}
          tone="purple"
        />
        <b aria-hidden="true">→</b>
        <FunnelStep
          label="Leads"
          value={formatWholeNumber(metrics.leads)}
          tone="green"
        />
      </div>

      <div className="rates">
        <span>
          Engagement rate: <strong>{metrics.engagementRate.toFixed(1)}%</strong>
        </span>
        <span>
          Lead rate: <strong>{metrics.leadRate.toFixed(2)}%</strong>
        </span>
      </div>
    </section>
  );
}

function FunnelStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "purple" | "green";
}) {
  return (
    <div className={`funnel-step ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatWholeNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

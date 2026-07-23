import { MarketingFunnel } from "@/components/dashboard/MarketingFunnel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TopContentCard } from "@/components/dashboard/TopContentCard";
import type { DashboardData } from "@/services/analytics/types";
import { getDashboardData } from "@/services/dashboard/getDashboardData";

export const dynamic = "force-dynamic";

const PROTOTYPE_LEAD_GOAL: number = 25;

export default async function HomePage() {
  let dashboardData: DashboardData | null;

  try {
    dashboardData = await getDashboardData();
  } catch (error: unknown) {
    console.error("Unable to load the database-powered dashboard:", error);

    return (
      <DashboardUnavailable message="The dashboard could not connect to its SQL Server data. Confirm that SQL Server is running and that the local environment values are correct." />
    );
  }

  if (!dashboardData) {
    return (
      <DashboardUnavailable message="The configured central content item is missing or inactive. Run the Phase 2 seed command and refresh this page." />
    );
  }

  const { combinedMetrics, platformMetrics } = dashboardData;
  const leadGoalProgress =
    PROTOTYPE_LEAD_GOAL === 0
      ? 0
      : Math.round((combinedMetrics.leads / PROTOTYPE_LEAD_GOAL) * 100);
  const progressWidth = Math.min(leadGoalProgress, 100);

  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <DashboardHeader />

        <section className="goal-card">
          <div>
            <h2>Prototype Lead Goal</h2>
            <p className="goal-number">
              {formatWholeNumber(combinedMetrics.leads)}{" "}
              <span>of {PROTOTYPE_LEAD_GOAL} leads</span>
            </p>
            <p className="positive">{leadGoalProgress}% toward your goal</p>
          </div>
          <div className="progress-wrap">
            <div
              className="progress"
              aria-label={`${leadGoalProgress} percent toward goal`}
            >
              <div style={{ width: `${progressWidth}%` }} />
            </div>
            <span className="target" aria-hidden="true">
              ◎
            </span>
          </div>
        </section>

        <section className="metric-grid">
          <MetricCard
            icon="◉"
            title="Reach"
            value={formatCompactNumber(combinedMetrics.reach)}
            change={`Across ${platformMetrics.length} linked posts`}
            tone="blue"
          />
          <MetricCard
            icon="♡"
            title="Engagements"
            value={formatWholeNumber(combinedMetrics.engagements)}
            change="Includes saves and reactions"
            tone="purple"
          />
          <MetricCard
            icon="♟"
            title="Leads"
            value={formatWholeNumber(combinedMetrics.leads)}
            change="Stored link-click total"
            tone="green"
          />
        </section>

        <MarketingFunnel metrics={combinedMetrics} />

        <TopContentCard
          title={dashboardData.contentTitle}
          description={dashboardData.contentDescription}
          campaignName={dashboardData.campaignName}
          contentTypeLabel={dashboardData.contentTypeLabel}
          combinedMetrics={combinedMetrics}
          platformMetrics={platformMetrics}
        />
      </section>

      <MarketingAssistantPreview />
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Marketing overview</p>
        <h1>Good morning, Joseph 👋</h1>
        <p>Here&apos;s how your stored marketing snapshot is performing.</p>
      </div>
      <button className="date-button" type="button" disabled>
        📊 Current snapshot
      </button>
    </header>
  );
}

function DashboardUnavailable({ message }: { message: string }) {
  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <DashboardHeader />
        <section className="panel">
          <h2>Dashboard data unavailable</h2>
          <p>{message}</p>
        </section>
      </section>

      <MarketingAssistantPreview />
    </div>
  );
}

function MarketingAssistantPreview() {
  return (
    <aside className="assistant">
      <div className="assistant-header">
        <strong>✦ Marketing Help</strong>
        <span>Coming soon</span>
      </div>
      <div className="assistant-body">
        <div className="ai-logo">AI</div>
        <h2>AI Agent Preview</h2>
        <p>
          This area will eventually explain performance and help Joseph plan
          content.
        </p>
        <button type="button" disabled>
          Give me a post idea
        </button>
        <button type="button" disabled>
          What should I post this week?
        </button>
        <button type="button" disabled>
          How can I get more leads?
        </button>
        <div className="chat-placeholder">
          The AI Agent remains intentionally nonfunctional in Phase 3.
        </div>
      </div>
      <div className="assistant-input">
        <input disabled placeholder="AI Agent coming soon..." />
        <button type="button" disabled>
          ➤
        </button>
      </div>
    </aside>
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

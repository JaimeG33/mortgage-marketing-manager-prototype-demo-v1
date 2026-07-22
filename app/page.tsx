import { MarketingFunnel } from "@/components/dashboard/MarketingFunnel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TopContentCard } from "@/components/dashboard/TopContentCard";
import { combineMetrics } from "@/services/analytics/combineMetrics";
import { getManualInstagramMetrics } from "@/services/analytics/manualInstagramProvider";
import { getYouTubeMetrics } from "@/services/analytics/youtubeProvider";

const contentTitle = "5 Things Every First-Time Buyer Should Know";

export default function HomePage() {
  const platformMetrics = [
    getYouTubeMetrics(),
    getManualInstagramMetrics(),
  ];
  const combinedMetrics = combineMetrics(platformMetrics);

  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Marketing overview</p>
            <h1>Good morning, Joseph 👋</h1>
            <p>Here&apos;s how your marketing is doing today.</p>
          </div>
          <button className="date-button" type="button">
            📅 Last 30 days ▾
          </button>
        </header>

        <section className="goal-card">
          <div>
            <h2>Monthly Lead Goal</h2>
            <p className="goal-number">
              14 <span>of 25 leads</span>
            </p>
            <p className="positive">56% toward your goal</p>
          </div>
          <div className="progress-wrap">
            <div className="progress" aria-label="56 percent toward goal">
              <div />
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
            change="18% vs last 30 days"
            tone="blue"
          />
          <MetricCard
            icon="♡"
            title="Engagements"
            value={formatWholeNumber(combinedMetrics.engagements)}
            change="15% vs last 30 days"
            tone="purple"
          />
          <MetricCard
            icon="♟"
            title="Leads"
            value={formatWholeNumber(combinedMetrics.leads)}
            change="22% vs last 30 days"
            tone="green"
          />
        </section>

        <MarketingFunnel metrics={combinedMetrics} />

        <TopContentCard
          title={contentTitle}
          description="The same video is represented by one central content identity with separate YouTube and Instagram analytics providers."
          combinedMetrics={combinedMetrics}
          platformMetrics={platformMetrics}
        />
      </section>

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
            The AI Agent is intentionally nonfunctional in Phase 1.
          </div>
        </div>
        <div className="assistant-input">
          <input disabled placeholder="AI Agent coming soon..." />
          <button type="button" disabled>
            ➤
          </button>
        </div>
      </aside>
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

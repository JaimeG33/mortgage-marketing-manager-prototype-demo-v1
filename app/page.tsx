const platformRows = [
  { platform: "YouTube", letter: "Y", className: "youtube", reach: "11.8K", engagement: "624", leads: "18" },
  { platform: "Instagram", letter: "I", className: "instagram", reach: "6.8K", engagement: "412", leads: "9" },
];

export default function HomePage() {
  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Marketing overview</p>
            <h1>Good morning, Joseph 👋</h1>
            <p>Here&apos;s how your marketing is doing today.</p>
          </div>
          <button className="date-button">📅 Last 30 days ▾</button>
        </header>

        <section className="goal-card">
          <div>
            <h2>Monthly Lead Goal</h2>
            <p className="goal-number">14 <span>of 25 leads</span></p>
            <p className="positive">56% toward your goal</p>
          </div>
          <div className="progress-wrap">
            <div className="progress"><div /></div>
            <span className="target">◎</span>
          </div>
        </section>

        <section className="metric-grid">
          <MetricCard icon="◉" title="Reach" value="18.6K" change="18% vs last 30 days" tone="blue" />
          <MetricCard icon="♡" title="Engagements" value="1,036" change="15% vs last 30 days" tone="purple" />
          <MetricCard icon="♟" title="Leads" value="27" change="22% vs last 30 days" tone="green" />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Your Marketing Funnel</h2><p>Combined results from connected platforms</p></div>
            <span className="updated">Updated just now</span>
          </div>
          <div className="funnel">
            <FunnelStep label="Reach" value="18,600" tone="blue" />
            <b>→</b>
            <FunnelStep label="Engagements" value="1,036" tone="purple" />
            <b>→</b>
            <FunnelStep label="Leads" value="27" tone="green" />
          </div>
          <div className="rates"><span>Engagement rate: <strong>5.6%</strong></span><span>Lead rate: <strong>0.15%</strong></span></div>
        </section>

        <section className="content-section">
          <div className="panel-heading">
            <div><h2>Top Performing Content</h2><p>One content item tracked across multiple platforms</p></div>
            <button className="link-button">View details</button>
          </div>
          <article className="content-card">
            <div className="video-preview">
              <span>SHORT VIDEO</span>
              <div className="play">▶</div>
              <strong>5 Things Every First-Time Buyer Should Know</strong>
            </div>
            <div className="content-info">
              <p className="eyebrow">First-time buyer series</p>
              <h2>5 Things Every First-Time Buyer Should Know</h2>
              <p className="description">The same video is stored as one central content item with separate YouTube and Instagram links.</p>
              <div className="mini-grid">
                <Mini label="Combined reach" value="18.6K" />
                <Mini label="Engagements" value="1,036" />
                <Mini label="Leads" value="27" />
              </div>
              <div className="platform-list">
                {platformRows.map((row) => (
                  <div className="platform-row" key={row.platform}>
                    <span className={`platform-logo ${row.className}`}>{row.letter}</span>
                    <strong>{row.platform}</strong>
                    <span>{row.reach} reach</span>
                    <span>{row.engagement} engagements</span>
                    <span>{row.leads} leads</span>
                    <button>Open post</button>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      </section>

      <aside className="assistant">
        <div className="assistant-header"><strong>✦ Marketing Help</strong><span>Coming soon</span></div>
        <div className="assistant-body">
          <div className="ai-logo">AI</div>
          <h2>AI Agent Preview</h2>
          <p>This area will eventually explain performance and help Joseph plan content.</p>
          <button disabled>Give me a post idea</button>
          <button disabled>What should I post this week?</button>
          <button disabled>How can I get more leads?</button>
          <div className="chat-placeholder">The AI Agent is intentionally nonfunctional in Phase 1.</div>
        </div>
        <div className="assistant-input"><input disabled placeholder="AI Agent coming soon..." /><button disabled>➤</button></div>
      </aside>
    </div>
  );
}

function MetricCard({ icon, title, value, change, tone }: { icon: string; title: string; value: string; change: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><div><h3>{title}</h3><strong>{value}</strong><p className="positive">↗ {change}</p></div></article>;
}
function FunnelStep({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`funnel-step ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

interface MetricCardProps {
  icon: string;
  title: string;
  value: string;
  change: string;
  tone: "blue" | "purple" | "green";
}

export function MetricCard({
  icon,
  title,
  value,
  change,
  tone,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3>{title}</h3>
        <strong>{value}</strong>
        <p className="positive">↗ {change}</p>
      </div>
    </article>
  );
}

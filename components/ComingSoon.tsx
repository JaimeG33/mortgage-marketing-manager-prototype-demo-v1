import Link from "next/link";

export function ComingSoon({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="coming-page">
      <div className="coming-card">
        <div className="coming-icon">{icon}</div>
        <p className="eyebrow">Future feature</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link href="/">Return to dashboard</Link>
      </div>
    </div>
  );
}

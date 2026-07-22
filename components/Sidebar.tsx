"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/ai-agent", label: "AI Agent", icon: "✦" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">⌂</div>
        <div><strong>MortgageMate</strong><span>Marketing Analytics</span></div>
      </div>

      <nav>
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.href !== "/" && <small>Soon</small>}
            </Link>
          );
        })}
      </nav>

      <div className="profile">
        <div className="avatar">JM</div>
        <div><strong>Joseph</strong><span>Loan Officer</span></div>
      </div>
    </aside>
  );
}

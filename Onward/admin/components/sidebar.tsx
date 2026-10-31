"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { admin } from "@/lib/data";

const PRIMARY = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/users", label: "Users", Icon: Users },
  { href: "/broadcasts", label: "Broadcasts", Icon: Megaphone },
];

const SECONDARY = [
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/audit", label: "Audit log", Icon: ScrollText },
  { href: "/settings", label: "Settings", Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  Icon,
  pathname,
}: {
  href: string;
  label: string;
  Icon: typeof Users;
  pathname: string;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
        active
          ? "bg-lime-soft text-ink"
          : "text-inksoft hover:bg-cream hover:text-ink"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] ${active ? "text-lime-deep" : "text-muted group-hover:text-inksoft"}`}
        strokeWidth={active ? 2.3 : 2}
      />
      {label}
      {active ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime-deep" />
      ) : null}
    </Link>
  );
}

export function Sidebar({ open }: { open?: boolean }) {
  const pathname = usePathname();
  return (
    <aside
      className={`sticky top-0 z-40 flex h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-paper px-3 py-5 ${
        open ? "flex" : "hidden lg:flex"
      }`}
    >
      <Link href="/" className="mb-6 flex items-center gap-1 px-2">
        <Wordmark className="text-[16px]" />
      </Link>

      <nav className="scroll-thin flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Manage
          </p>
          <div className="space-y-0.5">
            {PRIMARY.map((i) => (
              <NavItem key={i.href} {...i} pathname={pathname} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Insights
          </p>
          <div className="space-y-0.5">
            {SECONDARY.map((i) => (
              <NavItem key={i.href} {...i} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      <Link
        href="/support"
        className="mb-2 flex items-center gap-2 rounded-xl border border-dash px-3 py-2 text-[11.5px] font-semibold text-inksoft transition hover:border-lime-deep hover:text-ink"
      >
        <LifeBuoy className="h-4 w-4" strokeWidth={2.1} />
        Help &amp; docs
      </Link>

      <div className="flex items-center gap-2.5 rounded-xl border border-line px-2 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
          {admin.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-bold text-ink">
            {admin.name}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {admin.role}
          </span>
        </span>
      </div>
    </aside>
  );
}

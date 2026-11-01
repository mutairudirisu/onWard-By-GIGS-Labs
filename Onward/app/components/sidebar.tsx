"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallButton } from "@/components/install-button";
import { Wordmark } from "@/components/wordmark";
import { useCurrentUser } from "@/components/auth";
import { UnreadDot, useNotifications } from "@/components/notifications";
import {
  BarChart3,
  Bell,
  Flame,
  GraduationCap,
  Home,
  ListChecks,
  NotebookPen,
  Plus,
  Sprout,
  Trophy,
  User,
} from "lucide-react";

const MENU = [
  { href: "/today", label: "Today", Icon: Home },
  { href: "/tasks", label: "Tasks", Icon: ListChecks },
  { href: "/notes", label: "Notes", Icon: NotebookPen },
  { href: "/onwards", label: "onWards", Icon: Sprout },
  { href: "/notifications", label: "Notifications", Icon: Bell, badge: true },
  { href: "/profile", label: "You", Icon: User },
];

const PROGRESS = [
  { href: "/streaks", label: "Streaks", Icon: Flame },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  { href: "/insights", label: "Insights", Icon: BarChart3 },
  { href: "/student", label: "Student space", Icon: GraduationCap },
];

const AUTH_ROUTES = [
  "/",
  "/verify",
  "/usage",
  "/sign-in",
  "/create-account",
  "/forgot-password",
];

function isActive(pathname: string, href: string) {
  if (href === "/profile") {
    return pathname === "/profile" || pathname.startsWith("/profile/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({
  title,
  items,
  pathname,
  unread = 0,
}: {
  title: string;
  items: { href: string; label: string; Icon: typeof Home; badge?: boolean }[];
  pathname: string;
  unread?: number;
}) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, label, Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                active
                  ? "bg-lime-soft text-ink"
                  : "text-inksoft hover:bg-cream hover:text-ink"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${active ? "text-lime-deep" : ""}`}
                strokeWidth={active ? 2.3 : 2}
              />
              {label}
              {badge && unread > 0 ? (
                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { unread } = useNotifications();
  if (AUTH_ROUTES.includes(pathname)) return null;

  return (
    <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-line bg-paper px-3 py-5 md:flex lg:w-[248px]">
      <Link href="/today" className="mb-5 flex items-center gap-1 px-2">
        <Sprout className="h-6 w-6 text-lime-deep" strokeWidth={2.2} />
        <Wordmark className="text-[17px]" />
      </Link>

      <Link
        href="/onwards/new"
        className="mb-6 flex items-center justify-center gap-2 rounded-btn bg-lime px-3 py-2.5 text-[13px] font-semibold text-dark transition hover:bg-lime-deep"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        New onWard
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        <NavGroup title="Menu" items={MENU} pathname={pathname} unread={unread} />
        <NavGroup title="Progress" items={PROGRESS} pathname={pathname} />
      </nav>

      <InstallButton className="mb-2 justify-center rounded-xl border border-dash px-3 py-2 text-[11.5px] font-semibold text-inksoft transition hover:border-lime-deep hover:text-ink" />

      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-cream"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[10px] font-bold text-ink">
          {user.initials}
          <UnreadDot />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-bold text-ink">{user.name}</span>
          <span className="block truncate text-[10px] text-muted">{user.role}</span>
        </span>
      </Link>
    </aside>
  );
}

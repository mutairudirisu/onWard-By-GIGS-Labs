"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MessagesSquare, Plus, Sprout, User, X } from "lucide-react";
import { useStore } from "@/components/store";
import { CreateMenu, EXCHANGE_CREATES } from "@/components/create-menu";
import { UnreadDot } from "@/components/notifications";
import { useExchangeBadge } from "@/lib/exchange-badge";
import { haptic } from "@/lib/haptics";

const TABS = [
  { id: "today", label: "Home", href: "/today", Icon: Home },
  { id: "onwards", label: "onWards", href: "/onwards", Icon: Sprout },
  { id: "feed", label: "Exchange", href: "/feed", Icon: MessagesSquare },
  { id: "you", label: "You", href: "/profile", Icon: User },
] as const;

export type TabId = (typeof TABS)[number]["id"];

/** Posts from other people that landed since the Exchange was last read. */
function ExchangeBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2.5 -top-2 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[8.5px] font-bold leading-none tracking-tight text-white tabular-nums ring-2 ring-paper">
      {count > 99 ? "99+" : `+${count}`}
    </span>
  );
}

const CREATES = [
  { label: "New Exchange post", href: "/feed/new", Icon: MessagesSquare },
  { label: "Create an onWard", href: "/onwards/new", Icon: Sprout },
];

export function BottomNav({ active }: { active: TabId }) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useStore();
  const [choosing, setChoosing] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const newPosts = useExchangeBadge(active === "feed");

  const buzz = (kind: "tap" | "success") => haptic(kind, settings.haptics);

  useEffect(() => {
    let lastY = window.scrollY;
    let stopTimer: number | undefined;

    const onScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastY;

      if (currentY <= 8) {
        setNavVisible(true);
      } else if (Math.abs(delta) >= 4) {
        setNavVisible(delta < 0);
      }

      lastY = currentY;
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => setNavVisible(true), 180);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
    };
  }, []);

  useEffect(() => setNavVisible(true), [pathname]);

  // On the page that is about one thing, the button goes straight there. On the
  // Exchange the + offers the three things you can make in it.
  const straightTo = active === "onwards" ? "/onwards/new" : null;
  const creates = active === "feed" ? EXCHANGE_CREATES : CREATES;

  useEffect(() => setChoosing(false), [pathname]);

  useEffect(() => {
    if (!choosing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChoosing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choosing]);

  const go = (href: string) => {
    buzz("success");
    setChoosing(false);
    router.push(href);
  };

  return (
    <nav
      className={`relative z-40 bg-cream px-5 pb-3 pt-3 transition-[transform,opacity] duration-200 ease-out ${
        navVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      {choosing ? (
        <CreateMenu
          choices={creates}
          className="bottom-[116px] right-3 items-end"
          onClose={() => setChoosing(false)}
          onPick={go}
        />
      ) : null}

      <div className="relative z-40 flex items-center justify-center gap-2">
        {/* One fixed width, so swapping which label is open moves nothing else. */}
        <div className="flex w-[272px] items-center justify-between rounded-full bg-paper px-2 py-2 shadow-[0_10px_30px_rgba(16,17,8,0.08)]">
          {TABS.map(({ id, label, href, Icon }) =>
            id === active ? (
              <Link
                key={id}
                href={href}
                aria-current="page"
                onClick={() => buzz("tap")}
                className="flex h-11 items-center gap-1.5 rounded-full bg-lime-soft px-3.5 ring-1 ring-inset ring-lime/40"
              >
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px] text-lime-deep" strokeWidth={2.2} />
                  {id === "you" ? <UnreadDot /> : null}
                  {id === "feed" ? <ExchangeBadge count={newPosts} /> : null}
                </span>
                <span className="text-[11.5px] font-bold text-ink">{label}</span>
              </Link>
            ) : (
              <Link
                key={id}
                href={href}
                aria-label={label}
                onClick={() => buzz("tap")}
                className="flex h-11 w-11 items-center justify-center rounded-full text-faint transition hover:text-lime-deep"
              >
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  {id === "you" ? <UnreadDot /> : null}
                  {id === "feed" ? <ExchangeBadge count={newPosts} /> : null}
                </span>
              </Link>
            ),
          )}
        </div>

        <button
          type="button"
          aria-label={straightTo ? "Log an onWard" : "Create"}
          aria-expanded={choosing}
          onClick={() => {
            if (straightTo) return go(straightTo);
            buzz("tap");
            setChoosing((open) => !open);
          }}
          className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-lime text-dark shadow-[0_10px_30px_rgba(16,17,8,0.15)] transition active:scale-95"
        >
          {choosing ? (
            <X className="h-[22px] w-[22px]" strokeWidth={2.4} />
          ) : (
            <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
          )}
        </button>
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MessagesSquare, Plus, Sprout, User, UsersRound, X } from "lucide-react";
import { useStore } from "@/components/store";
import { CreateMenu, EXCHANGE_CREATES } from "@/components/create-menu";
import { UnreadDot } from "@/components/notifications";
import { useExchangeBadge } from "@/lib/exchange-badge";
import { haptic } from "@/lib/haptics";

const TABS = [
  { id: "today", label: "Home", href: "/today", Icon: Home },
  { id: "onwards", label: "onWards", href: "/onwards", Icon: Sprout },
  { id: "feed", label: "Exchange", href: "/feed", Icon: MessagesSquare },
  { id: "network", label: "My Network", href: "/network", Icon: UsersRound },
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
  const newPosts = useExchangeBadge(active === "feed");

  const buzz = (kind: "tap" | "success") => haptic(kind, settings.haptics);

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
    <nav className="relative z-40 border-t border-line/50 bg-cream/85 px-5 pb-3 pt-3 backdrop-blur-xl">
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
        <div className="flex w-full min-w-0 max-w-[280px] items-center justify-between rounded-full border border-line/60 bg-paper/80 px-1.5 py-2 shadow-[0_10px_30px_rgba(16,17,8,0.12)] backdrop-blur-xl">
          {TABS.map(({ id, label, href, Icon }) =>
            id === active ? (
              <Link
                key={id}
                href={href}
                aria-current="page"
                onClick={() => buzz("tap")}
                className="relative isolate flex h-9 items-center gap-1 overflow-hidden rounded-full border border-lime/60 bg-lime/10 px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_14px_rgba(201,242,78,0.12)] backdrop-blur-md transition"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-px rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent"
                />
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px] text-lime-deep" strokeWidth={2.2} />
                  {id === "you" ? <UnreadDot /> : null}
                  {id === "feed" ? <ExchangeBadge count={newPosts} /> : null}
                </span>
                <span className="relative text-[9.5px] font-bold text-ink">{label}</span>
              </Link>
            ) : (
              <Link
                key={id}
                href={href}
                aria-label={label}
                onClick={() => buzz("tap")}
                className="flex h-9 w-7 items-center justify-center rounded-full text-muted transition hover:bg-lime-pale/50 hover:text-lime-deep"
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Megaphone, Plus, Sprout, User } from "lucide-react";
import { useStore } from "@/components/store";
import { UnreadDot } from "@/components/notifications";
import { haptic } from "@/lib/haptics";

const TABS = [
  { id: "today", label: "Today", href: "/today", Icon: Home },
  { id: "onwards", label: "onWards", href: "/onwards", Icon: Sprout },
  { id: "feed", label: "Posts", href: "/feed", Icon: Megaphone },
  { id: "you", label: "You", href: "/profile", Icon: User },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function BottomNav({ active }: { active: TabId }) {
  const router = useRouter();
  const { settings } = useStore();

  const buzz = (kind: "tap" | "success") => haptic(kind, settings.haptics);

  // The one capture button takes you to whatever the screen you are on is about.
  const create =
    active === "feed"
      ? { label: "Write a post", href: "/feed/new" }
      : { label: "Log an onWard", href: "/onwards/new" };

  return (
    <nav className="relative z-40 bg-cream px-4 pb-2.5 pt-2.5">

      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full bg-paper px-1.5 py-1.5 shadow-[0_10px_30px_rgba(16,17,8,0.08)]">
          {TABS.map(({ id, label, href, Icon }) =>
            id === active ? (
              <Link
                key={id}
                href={href}
                aria-current="page"
                onClick={() => buzz("tap")}
                className="flex items-center gap-1.5 rounded-full bg-line py-2 pl-3 pr-3.5"
              >
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px] text-lime-deep" strokeWidth={2.2} />
                  {id === "you" ? <UnreadDot /> : null}
                </span>
                <span className="text-[11px] font-bold text-lime-deep">{label}</span>
              </Link>
            ) : (
              <Link
                key={id}
                href={href}
                aria-label={label}
                onClick={() => buzz("tap")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-faint transition hover:text-lime-deep"
              >
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  {id === "you" ? <UnreadDot /> : null}
                </span>
              </Link>
            ),
          )}
        </div>

        {/* One thing to capture, so the button goes straight to it. */}
        <button
          type="button"
          aria-label={create.label}
          onClick={() => {
            buzz("success");
            router.push(create.href);
          }}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-lime text-dark shadow-[0_10px_30px_rgba(16,17,8,0.15)] transition active:scale-95"
        >
          <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
        </button>
      </div>
    </nav>
  );
}

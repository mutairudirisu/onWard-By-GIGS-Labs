"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  FilePlus2,
  Home,
  ListChecks,
  NotebookPen,
  Plus,
  Sprout,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/components/store";
import { UnreadDot } from "@/components/notifications";
import { haptic } from "@/lib/haptics";

const TABS = [
  { id: "today", label: "Today", href: "/today", Icon: Home },
  { id: "tasks", label: "Tasks", href: "/tasks", Icon: ListChecks },
  { id: "notes", label: "Notes", href: "/notes", Icon: NotebookPen },
  { id: "onwards", label: "onWards", href: "/onwards", Icon: Sprout },
  { id: "you", label: "You", href: "/profile", Icon: User },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const CREATE_OPTIONS = [
  { label: "New task", key: "task", Icon: CheckSquare },
  { label: "New note", key: "note", Icon: FilePlus2 },
  { label: "New onWard", key: "ward", Icon: Sprout },
] as const;

export function BottomNav({ active }: { active: TabId }) {
  const router = useRouter();
  const { addNote, settings } = useStore();
  const [open, setOpen] = useState(false);

  const buzz = (kind: "tap" | "success") => haptic(kind, settings.haptics);

  const create = (key: (typeof CREATE_OPTIONS)[number]["key"]) => {
    setOpen(false);
    buzz("success");
    if (key === "task") router.push("/tasks?new=1");
    else if (key === "note") {
      const id = addNote({ tag: "Personal" });
      router.push(`/notes/${id}`);
    } else router.push("/onwards/new");
  };

  return (
    <nav className="relative z-40 bg-cream px-4 pb-2.5 pt-2.5">
      {open ? (
        <button
          type="button"
          aria-label="Close create menu"
          onClick={() => {
            setOpen(false);
            buzz("tap");
          }}
          className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px]"
        />
      ) : null}

      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 items-center justify-between rounded-full bg-paper px-2 py-2 shadow-[0_10px_30px_rgba(16,17,8,0.08)]">
          {TABS.map(({ id, label, href, Icon }) =>
            id === active ? (
              <Link
                key={id}
                href={href}
                aria-current="page"
                onClick={() => buzz("tap")}
                className="flex items-center gap-1.5 rounded-full bg-line py-2.5 pl-3.5 pr-4"
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
                className="flex h-11 w-11 items-center justify-center rounded-full text-faint transition hover:text-lime-deep"
              >
                <span className="relative flex">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  {id === "you" ? <UnreadDot /> : null}
                </span>
              </Link>
            ),
          )}
        </div>

        <div className="relative z-50">
          {open ? (
            <div
              role="menu"
              aria-label="What do you want to create?"
              className="absolute bottom-[calc(100%+16px)] right-0 w-[264px] rounded-[26px] bg-panel p-2.5 shadow-[0_24px_60px_rgba(16,17,8,0.35)]"
            >
              <div className="grid grid-cols-3 gap-2">
                {CREATE_OPTIONS.map(({ label, key, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={() => create(key)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-panel-soft px-2 py-4 text-on-panel transition hover:bg-[#34352C]"
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    <span className="text-center text-[10px] font-semibold leading-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            aria-label={open ? "Close create menu" : "Create something new"}
            aria-expanded={open}
            onClick={() => {
              setOpen((o) => !o);
              buzz("tap");
            }}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-lime text-dark shadow-[0_10px_30px_rgba(16,17,8,0.15)] transition active:scale-95"
          >
            {open ? (
              <X className="h-[22px] w-[22px]" strokeWidth={2.4} />
            ) : (
              <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

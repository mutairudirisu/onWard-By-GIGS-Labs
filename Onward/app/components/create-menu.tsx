"use client";

import { BarChart3, Hash, MessagesSquare, type LucideIcon } from "lucide-react";

export type CreateChoice = { label: string; href: string; Icon: LucideIcon };

/** What the Exchange lets you make: a writing, a question with choices, or a room. */
export const EXCHANGE_CREATES: CreateChoice[] = [
  { label: "New post", href: "/feed/new", Icon: MessagesSquare },
  { label: "New poll", href: "/feed/new?mode=poll", Icon: BarChart3 },
  { label: "New channel", href: "/channels?new=1", Icon: Hash },
];

/**
 * The frosted-page chooser: no panel behind the choices, the page itself blurs over
 * so the things you can make are the only things in focus. The caller places the
 * stack; the frost always covers the whole page.
 */
export function CreateMenu({
  choices,
  className,
  onPick,
  onClose,
}: {
  choices: CreateChoice[];
  className: string;
  onPick: (href: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-30 backdrop-blur-[14px]"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="menu"
        aria-label="Create"
        className={`absolute z-50 flex flex-col gap-4 ${className}`}
        style={{ animation: "onward-sheet 0.18s ease-out" }}
      >
        {choices.map(({ label, href, Icon }) => (
          <button
            key={href}
            type="button"
            role="menuitem"
            onClick={() => onPick(href)}
            className="flex w-max cursor-pointer items-center gap-2.5"
          >
            <span className="text-[11.5px] font-bold text-ink">{label}</span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime text-dark shadow-[0_8px_20px_rgba(16,17,8,0.18)]">
              <Icon className="h-[19px] w-[19px]" strokeWidth={2.2} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
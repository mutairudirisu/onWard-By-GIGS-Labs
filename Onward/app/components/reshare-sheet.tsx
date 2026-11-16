"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat2 } from "lucide-react";
import { useCurrentUser } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { useSheetDrag } from "@/components/sheet-drag";
import { POST_BODY_MAX } from "@/lib/db";
import { useKeyboardInset } from "@/lib/keyboard";

/** Only what the composer needs to show about the entry being passed on. */
export type ReshareTarget = {
  id: string;
  title: string;
  body: string;
  fullName: string;
};

/**
 * Reposting somebody's entry, with the option of saying why. The thought is never
 * required - the Repost button works with the box empty - so the sheet is a step on the
 * way, not a wall. Closing it with words still typed asks once whether to throw them
 * away, because a repost nobody meant is harder to notice than a half-written sentence.
 */
export function ReshareSheet({
  target,
  open,
  onClose,
  onConfirm,
}: {
  target: ReshareTarget | null;
  open: boolean;
  onClose: () => void;
  /** Repost this entry with these words, which may be none. */
  onConfirm: (thought: string) => void;
}) {
  const me = useCurrentUser();
  const [draft, setDraft] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const keyboard = useKeyboardInset(open);

  // Every way out of the sheet asks the same question once there are words in the box -
  // the close button, the page behind it, Escape and a drag down.
  const requestClose = useCallback(() => {
    if (draft.trim()) setDiscarding(true);
    else onClose();
  }, [draft, onClose]);
  const { gripProps, shellStyle } = useSheetDrag(open, requestClose);

  const words = target ? target.title || target.body : "";

  useEffect(() => {
    if (!open) return;
    setDraft("");
    setDiscarding(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape means the same thing as the close button, so it asks the same question.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!open || !target) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex justify-center"
      style={{ paddingBottom: keyboard }}
      role="dialog"
      aria-modal="true"
      aria-label="Repost with a thought"
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={requestClose}
      />
      <div
        className="relative mt-auto flex w-full max-w-none flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift md:max-w-[420px]"
        style={shellStyle}
      >
        <div
          {...gripProps()}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
          aria-label="Drag to make this bigger"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-4 pb-2">
          <h2 className="flex-1 text-[13px] font-bold tracking-tight text-ink">Repost</h2>
          <button
            type="button"
            aria-label="Close repost"
            onClick={requestClose}
            className="-mr-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="shrink-0 px-4">
          <div className="rounded-2xl border border-line bg-cream px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              <Repeat2 className="h-3.5 w-3.5" />
              {target.fullName || "Someone"}&rsquo;s post
            </p>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.5] text-ink [overflow-wrap:anywhere]">
              {words || "A post with files only"}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-start gap-2.5 px-4 pb-3 pt-3.5">
          <Avatar
            initials={me.initials || (me.name.slice(0, 1).toUpperCase() || "?")}
            src={me.avatarUrl}
          />
          <label className="flex min-w-0 flex-1 items-end rounded-2xl border border-line bg-paper px-3.5 py-2 focus-within:border-dash">
            <textarea
              value={draft}
              rows={1}
              autoFocus
              onChange={(event) => {
                const box = event.currentTarget;
                box.style.height = "auto";
                box.style.height = `${Math.min(140, box.scrollHeight)}px`;
                setDraft(event.target.value.slice(0, POST_BODY_MAX));
              }}
              placeholder="Add a thought…"
              aria-label="Add a thought about this post"
              className="wheel max-h-[140px] min-w-0 flex-1 resize-none bg-transparent text-[12px] leading-[1.5] text-ink outline-none placeholder:text-faint"
            />
          </label>
        </div>

        <div className="shrink-0 px-4 pb-4">
          <button
            type="button"
            onClick={() => onConfirm(draft.trim())}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3 text-[13px] font-bold text-dark transition hover:bg-lime-deep"
          >
            <Repeat2 className="h-4 w-4" strokeWidth={2.2} />
            Repost
          </button>
          <p className="mt-2 text-center text-[9.5px] leading-[1.5] text-muted">
            {draft.trim()
              ? "Goes to your stream with your words above it."
              : "Goes to your stream as it is. You can undo it right after."}
          </p>
        </div>

        {discarding ? (
          <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-t-3xl bg-paper px-4 pb-5 pt-8">
            <p className="text-[13px] font-bold tracking-tight text-ink">Discard thought?</p>
            <p className="mt-1.5 text-[11.5px] leading-[1.55] text-muted">
              Nothing is reposted and what you typed goes. You can start again any time.
            </p>
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDiscarding(false)}
                className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscarding(false);
                  onClose();
                }}
                className="flex-1 cursor-pointer rounded-btn bg-ink px-4 py-3 text-[13px] font-semibold text-paper transition hover:brightness-125"
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

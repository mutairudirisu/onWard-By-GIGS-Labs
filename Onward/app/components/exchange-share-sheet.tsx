"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Loader2, MoreHorizontal, Search, Send, X } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { useSheetDrag } from "@/components/sheet-drag";
import { PeopleSkeleton } from "@/components/skeleton";
import { TARGETS } from "@/components/share-sheet";
import { toastError, toastSuccess } from "@/components/toast";
import { useKeyboardInset } from "@/lib/keyboard";
import {
  fetchSharesFor,
  searchPeople,
  sharePostWith,
  unsharePostFrom,
  type ExchangePerson,
} from "@/lib/db";

/** What the drawer needs to know about the thing being handed on. */
export type ShareTarget = {
  id: string;
  title: string;
  body: string;
  fullName: string;
};

/**
 * Two audiences in one sheet. The list above is onWard: search the people, tap one and
 * the post is handed to them by name, and it appears on their Exchange under "Shared
 * with you". The row below is everyone else - the same targets the onWard card uses -
 * and none of it touches the app.
 */
export function ExchangeShareSheet({
  target,
  open,
  onClose,
}: {
  target: ShareTarget | null;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<ExchangePerson[] | undefined>(undefined);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const keyboard = useKeyboardInset(open);
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);

  const postId = target?.id ?? "";
  const words = target ? target.title || target.body : "";
  const permalink = target ? `${window.location.origin}/feed/${target.id}` : "";
  const shareText = target
    ? words.slice(0, 120) || `${target.fullName || "Someone"} shared on onWard`
    : "";

  // The pull the sheet opens with, and the names this post already went to, in one go.
  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setQuery("");
    setPeople(undefined);
    setSent(new Set());
    void Promise.all([searchPeople(), fetchSharesFor(postId)])
      .then(([rows, already]) => {
        if (cancelled) return;
        setPeople(rows);
        setSent(already);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  // Typed search, held back just enough that a name being spelled out is not a round
  // trip per letter.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed === "") {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      void searchPeople(trimmed)
        .then((rows) => setPeople(rows))
        .catch(() => toastError("Couldn't reach the people list"));
      setSearching(false);
    }, 260);
    return () => clearTimeout(timer);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const toggle = useCallback(
    (person: ExchangePerson) => {
      if (!postId) return;
      const turningOn = !sent.has(person.id);
      const apply = (on: boolean) => {
        setSent((prev) => {
          const next = new Set(prev);
          if (on) next.add(person.id);
          else next.delete(person.id);
          return next;
        });
      };
      apply(turningOn);
      void (turningOn ? sharePostWith(postId, person.id) : unsharePostFrom(postId, person.id))
        .then(() => {
          if (turningOn) toastSuccess(`Shared with ${person.name.split(" ")[0]}`);
        })
        .catch(() => {
          apply(!turningOn);
          toastError("Couldn't send that");
        });
    },
    [postId, sent],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${permalink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toastError("Couldn't copy the link");
    }
  }

  if (!open || !target) return null;

  const rows = people ?? [];
  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="fixed inset-0 z-[75] flex justify-center"
      style={{ paddingBottom: keyboard }}
      role="dialog"
      aria-modal="true"
      aria-label="Share this post"
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
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

        <div className="flex shrink-0 items-center gap-3 px-4 pb-1.5">
          <h2 className="flex-1 text-[13px] font-bold tracking-tight text-ink">Share this post</h2>
          <button
            type="button"
            aria-label="Close share"
            onClick={onClose}
            className="-mr-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <p className="shrink-0 truncate px-4 pb-3 text-[10.5px] text-muted">
          <span className="font-semibold text-inksoft">{target.fullName || "Someone"}</span>
          {words ? ` · ${words}` : ""}
        </p>

        <div className="shrink-0 px-4 pb-2.5">
          <label className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2 focus-within:border-dash">
            <Search className="h-[15px] w-[15px] shrink-0 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 60))}
              placeholder="Search onWard people"
              aria-label="Search onWard people"
              className="wheel min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
            />
            {searching ? <Loader2 className="h-[15px] w-[15px] animate-spin text-faint" /> : null}
          </label>
        </div>

        <div className="wheel min-h-0 flex-1 overflow-y-auto border-t border-line px-4">
          {people === undefined ? (
            <PeopleSkeleton />
          ) : !rows.length ? (
            <p className="py-10 text-center text-[11.5px] text-muted">
              {query.trim() ? "No one in onWard by that name." : "No one else is here yet."}
            </p>
          ) : (
            <ul>
              {rows.map((person) => {
                const done = sent.has(person.id);
                return (
                  <li key={person.id} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      aria-pressed={done}
                      onClick={() => toggle(person)}
                      className="flex w-full cursor-pointer items-center gap-2.5 py-2.5 text-left"
                    >
                      <Avatar
                        initials={person.initials || person.name.slice(0, 1).toUpperCase()}
                        src={person.avatarUrl}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-semibold text-ink">
                          {person.name}
                        </span>
                        {person.role ? (
                          <span className="block truncate text-[9.5px] text-muted">
                            {person.role}
                          </span>
                        ) : null}
                      </span>
                      {done ? (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-lime-deep">
                          <Check className="h-[15px] w-[15px]" strokeWidth={2.4} /> Sent
                        </span>
                      ) : (
                        <Send className="h-[15px] w-[15px] shrink-0 text-faint" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-4 py-3">
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.08em] text-faint">
            Or post it where your other audience is
          </p>
          <div className="wheel flex gap-2 overflow-x-auto">
            {TARGETS.map((t) => (
              <a
                key={t.id}
                href={t.href(shareText, permalink)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft text-[13px] font-bold text-ink">
                  {t.badge}
                </span>
                <span className="text-center text-[9.5px] leading-tight text-inksoft">
                  {t.label}
                </span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex w-[68px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </span>
              <span className="text-center text-[9.5px] leading-tight text-inksoft">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            {hasNativeShare ? (
              <button
                type="button"
                onClick={() => void navigator.share({ text: shareText, url: permalink }).catch(() => undefined)}
                className="flex w-[68px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
                <span className="text-center text-[9.5px] leading-tight text-inksoft">
                  More apps
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

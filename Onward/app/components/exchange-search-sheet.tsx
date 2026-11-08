"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hash, Loader2, Search, X } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { useSheetDrag } from "@/components/sheet-drag";
import { PeopleSkeleton } from "@/components/skeleton";
import { useKeyboardInset } from "@/lib/keyboard";
import { searchExchange, type SearchHits } from "@/lib/db";
import { timeAgo } from "@/lib/dates";

/**
 * One box over the whole Exchange. Nothing is filtered on the way in: an empty sheet
 * opens on whatever is already here, and typing narrows the people, the rooms and the
 * entries at once, so a half-remembered name and a half-remembered phrase both land.
 */
export function ExchangeSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHits | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [refused, setRefused] = useState(false);
  const keyboard = useKeyboardInset(open);
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRefused(false);
    // Held back just enough that spelling a name out is not a round trip per letter.
    const trimmed = query.trim();
    if (trimmed) setSearching(true);
    const timer = setTimeout(
      () => {
        void searchExchange(trimmed)
          .then((next) => {
            if (cancelled) return;
            setHits(next);
            setSearching(false);
          })
          .catch(() => {
            if (cancelled) return;
            setHits(undefined);
            setSearching(false);
            setRefused(true);
          });
      },
      trimmed ? 260 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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

  if (!open) return null;

  const found = hits;
  const empty = Boolean(
    found && !found.people.length && !found.channels.length && !found.posts.length,
  );

  return (
    <div
      className="fixed inset-0 z-[75] flex justify-center"
      style={{ paddingBottom: keyboard }}
      role="dialog"
      aria-modal="true"
      aria-label="Search the Exchange"
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative mt-auto flex w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift"
        style={shellStyle}
      >
        <div
          {...gripProps()}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
          aria-label="Drag to make this bigger"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-4 pb-2.5">
          <h2 className="flex-1 text-[13px] font-bold tracking-tight text-ink">
            Search the Exchange
          </h2>
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="-mr-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="shrink-0 px-4 pb-2.5">
          <label className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2 focus-within:border-dash">
            <Search className="h-[15px] w-[15px] shrink-0 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 60))}
              placeholder="People, channels, anything shared here"
              aria-label="Search people, channels and posts"
              className="wheel min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
            />
            {searching ? <Loader2 className="h-[15px] w-[15px] animate-spin text-faint" /> : null}
          </label>
        </div>

        <div className="wheel min-h-0 flex-1 overflow-y-auto border-t border-line px-4">
          {hits === undefined ? (
            refused ? (
              <p className="py-10 text-center text-[11.5px] text-muted">
                The Exchange is out of reach right now.
              </p>
            ) : (
              <PeopleSkeleton />
            )
          ) : empty ? (
            <p className="py-10 text-center text-[11.5px] text-muted">
              Nothing here matches &ldquo;{query.trim()}&rdquo; yet.
            </p>
          ) : (
            <>
              {found?.people.length ? (
                <section>
                  <SectionLabel>People</SectionLabel>
                  <ul>
                    {found.people.map((person) => (
                      <li key={person.id} className="border-b border-line last:border-0">
                        <Row href={`/people/${person.id}`} onClose={onClose}>
                          <Avatar
                            initials={person.initials || person.name.slice(0, 1).toUpperCase()}
                            src={person.avatarUrl}
                          />
                          <Words
                            top={person.name || "Someone"}
                            under={person.role ?? undefined}
                          />
                        </Row>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {found?.channels.length ? (
                <section>
                  <SectionLabel>Channels</SectionLabel>
                  <ul>
                    {found.channels.map((channel) => (
                      <li key={channel.id} className="border-b border-line last:border-0">
                        <Row href={`/channels/${channel.id}`} onClose={onClose}>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink">
                            <Hash className="h-4 w-4" />
                          </span>
                          <Words
                            top={channel.name}
                            under={
                              channel.about ||
                              `${channel.members} ${channel.members === 1 ? "member" : "members"}`
                            }
                          />
                        </Row>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {found?.posts.length ? (
                <section>
                  <SectionLabel>Posts</SectionLabel>
                  <ul>
                    {found.posts.map((post) => (
                      <li key={post.id} className="border-b border-line last:border-0">
                        <Row href={`/feed/${post.id}`} onClose={onClose}>
                          <Avatar
                            initials={post.initials || post.fullName.slice(0, 1).toUpperCase()}
                            src={post.avatarUrl}
                          />
                          <Words
                            top={post.title || post.body || "A post"}
                            under={`${post.fullName || "Someone"} · ${timeAgo(post.createdAt)}`}
                            clamp
                          />
                        </Row>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <p className="py-4 text-center text-[9.5px] leading-[1.55] text-faint">
                Everything found here is public to onWard.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-1 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </p>
  );
}

function Row({
  href,
  onClose,
  children,
}: {
  href: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex w-full cursor-pointer items-center gap-2.5 py-2.5 text-left transition hover:opacity-80"
    >
      {children}
    </Link>
  );
}

function Words({ top, under, clamp = false }: { top: string; under?: string; clamp?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span
        className={`block text-[11.5px] font-semibold text-ink [overflow-wrap:anywhere] ${
          clamp ? "line-clamp-2" : "truncate"
        }`}
      >
        {top}
      </span>
      {under ? <span className="block truncate text-[9.5px] text-muted">{under}</span> : null}
    </span>
  );
}

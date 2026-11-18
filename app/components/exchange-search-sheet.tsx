"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { PeopleSkeleton } from "@/components/skeleton";
import { searchExchange, type SearchHits } from "@/lib/db";
import { timeAgo } from "@/lib/dates";

const SEARCH_HISTORY_KEY = "onward.exchange.search-history";

/**
 * One box over the whole Exchange. Nothing is filtered on the way in: an empty sheet
 * opens on whatever is already here, and typing narrows the people and entries at once,
 * so a half-remembered name and a half-remembered phrase both land.
 */
export function ExchangeSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHits | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [refused, setRefused] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      setRecentQueries(
        Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string").slice(0, 8)
          : [],
      );
    } catch {
      setRecentQueries([]);
    }
  }, [open]);

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
    found && !found.people.length && !found.posts.length,
  );
  const rememberQuery = (value: string) => {
    const term = value.trim();
    if (!term) return;
    setRecentQueries((current) => {
      const next = [term, ...current.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 8);
      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // Search still works when local storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex flex-col bg-paper"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Search the Exchange"
    >
      <header className="shrink-0 px-4 pb-4 pt-3">
        <div className="rounded-[26px] bg-cream px-4 pb-3 pt-3">
          <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to the Exchange"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-paper"
          >
              <ArrowLeft className="h-6 w-6" />
          </button>
            <input
              autoFocus
              value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 80))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") rememberQuery(query);
                }}
              placeholder="Search the Exchange"
              aria-label="Search people and posts"
                className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            />
              {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-[10px] text-muted">Search posts and people across onWard</p>
            <button
              type="button"
              onClick={() => rememberQuery(query)}
              disabled={!query.trim()}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-lime-pale text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Save search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="wheel min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          {hits === undefined ? (
            refused ? (
              <p className="py-10 text-center text-[11.5px] text-muted">
                The Exchange is out of reach right now.
              </p>
            ) : (
              <PeopleSkeleton />
            )
          ) : query.trim() && empty ? (
            <p className="py-10 text-center text-[11.5px] text-muted">
              Nothing here matches &ldquo;{query.trim()}&rdquo; yet.
            </p>
          ) : query.trim() ? (
            <>
              {found?.people.length ? (
                <section>
                  <SectionLabel>People</SectionLabel>
                  <ul>
                    {found.people.map((person) => (
                      <li key={person.id} className="border-b border-line last:border-0">
                        <Row href={`/people/${person.id}`} onClose={() => {
                          rememberQuery(query);
                          onClose();
                        }}>
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

              {found?.posts.length ? (
                <section>
                  <SectionLabel>Posts</SectionLabel>
                  <ul>
                    {found.posts.map((post) => (
                      <li key={post.id} className="border-b border-line last:border-0">
                        <Row href={`/feed/${post.id}`} onClose={() => {
                          rememberQuery(query);
                          onClose();
                        }}>
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
          ) : (
            <>
              <SectionLabel>For You</SectionLabel>
              {recentQueries.length ? (
                <section>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="py-2 text-[10px] font-semibold text-muted">Recent searches</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentQueries([]);
                        try {
                          window.localStorage.removeItem(SEARCH_HISTORY_KEY);
                        } catch {
                          // History is optional.
                        }
                      }}
                      className="cursor-pointer py-2 text-[10px] font-semibold text-muted hover:text-ink"
                    >
                      Clear
                    </button>
                  </div>
                  <ul>
                    {recentQueries.map((term) => (
                      <li key={term} className="border-b border-line last:border-0">
                        <button
                          type="button"
                          onClick={() => setQuery(term)}
                          className="flex w-full cursor-pointer items-center gap-3 py-3 text-left text-[13px] text-ink hover:text-lime-deep"
                        >
                          <Search className="h-5 w-5 shrink-0 text-muted" />
                          <span className="truncate">{term}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {found?.posts.length ? (
                <section className="mt-4">
                  <SectionLabel>Popular in the Exchange</SectionLabel>
                  <ul>
                    {found.posts.map((post) => (
                      <li key={post.id} className="border-b border-line last:border-0">
                        <Row href={`/feed/${post.id}`} onClose={onClose}>
                          <TrendingUp className="h-5 w-5 shrink-0 text-muted" />
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
              {found?.people.length ? (
                <section className="mt-4">
                  <SectionLabel>People to discover</SectionLabel>
                  <ul>
                    {found.people.map((person) => (
                      <li key={person.id} className="border-b border-line last:border-0">
                        <Row href={`/people/${person.id}`} onClose={onClose}>
                          <Avatar
                            initials={person.initials || person.name.slice(0, 1).toUpperCase()}
                            src={person.avatarUrl}
                          />
                          <Words top={person.name || "Someone"} under={person.role ?? undefined} />
                        </Row>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
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

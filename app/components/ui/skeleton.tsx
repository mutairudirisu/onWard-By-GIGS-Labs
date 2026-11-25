"use client";

import type { HTMLAttributes } from "react";

/**
 * One grey block with a light sweeping across it. The composites below only arrange
 * these into the shape of the thing that is about to arrive, so a page holds its
 * layout while the read is in flight instead of showing a spinner in an empty box.
 */
export function Sk({ className = "", ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden className={`skel ${className}`} {...rest} />;
}

/** The header every card starts with: a face and two lines of who. */
function Head({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <Sk className="h-8 w-8 rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Sk className={`h-3 ${wide ? "w-2/5" : "w-1/4"}`} />
        <Sk className="h-2 w-1/6" />
      </span>
    </div>
  );
}

/** The words, and the row of things you can do with them. */
function Lines({ count = 3, media = false }: { count?: number; media?: boolean }) {
  const widths = ["w-full", "w-[92%]", "w-3/5", "w-[78%]"];
  return (
    <>
      <Sk className="h-3.5 w-2/3" />
      <span className="mt-2.5 flex flex-col gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <Sk key={i} className={`h-2.5 ${widths[i % widths.length]}`} />
        ))}
      </span>
      {media ? <Sk className="mt-3 aspect-[4/5] max-h-[320px] w-full rounded-2xl" /> : null}
      <span className="flex items-center gap-4 pb-1 pt-3">
        <Sk className="h-3.5 w-9" />
        <Sk className="h-3.5 w-6" />
        <Sk className="h-3.5 w-8" />
        <Sk className="ml-auto h-2.5 w-10" />
      </span>
    </>
  );
}

/** The Exchange timeline: the same cards, in the same order, standing empty. */
export function FeedSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-3.5" aria-busy="true">
      {Array.from({ length: cards }).map((_, i) => (
        <article key={i} className="border-b border-line pb-3.5">
          <Head wide={i === 1} />
          <Lines count={i === 0 ? 2 : 3} media={i === 0} />
        </article>
      ))}
    </div>
  );
}

/** A single post: its own card, then the thread that comes with it. */
export function PostSkeleton({ replies = 3 }: { replies?: number }) {
  return (
    <div aria-busy="true">
      <article className="border-b border-line pb-4">
        <Head wide />
        <Lines count={4} />
      </article>
      <span className="flex flex-col gap-3.5 pt-4">
        {Array.from({ length: replies }).map((_, i) => (
          <span key={i} className="flex gap-2.5">
            <Sk className="h-8 w-8 shrink-0 rounded-full" />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Sk className="h-2.5 w-3/4" />
              <Sk className="h-2.5 w-2/5" />
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

/** A comment thread in a sheet, or anywhere else a list of replies sits. */
export function ThreadSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3.5 py-4" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} className="flex gap-2.5">
          <Sk className="h-8 w-8 shrink-0 rounded-full" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Sk className={`h-2.5 ${i % 2 ? "w-5/6" : "w-2/3"}`} />
            <Sk className="h-2 w-1/4" />
          </span>
        </span>
      ))}
    </div>
  );
}

/** The people list in the share drawer: a face, a name, and where the tick goes. */
export function PeopleSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col py-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
          <Sk className="h-8 w-8 shrink-0 rounded-full" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Sk className={`h-2.5 ${i % 2 ? "w-1/3" : "w-2/5"}`} />
          </span>
          <Sk className="h-3.5 w-4 shrink-0" />
        </span>
      ))}
    </div>
  );
}

/** The board, which is a place number, a face, a name and a count on every row. */
export function BoardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col py-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} className="flex items-center gap-2.5 border-b border-line py-3 last:border-0">
          <Sk className="h-4 w-4 shrink-0 rounded" />
          <Sk className="h-8 w-8 shrink-0 rounded-full" />
          <Sk className={`h-2.5 ${i % 2 ? "w-1/2" : "w-2/5"}`} />
          <Sk className="ml-auto h-2.5 w-8 shrink-0" />
        </span>
      ))}
    </div>
  );
}

/** A short stack of lines, for a card that fills itself in. */
export function BlockSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <span className="flex flex-col gap-2 py-1" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} className={`h-2.5 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </span>
  );
}

/**
 * One onWard card, standing empty: the skill line, the title, the three lines of
 * what changed, and the row the evidence counts, the date and the share button
 * sit in.
 */
export function WardSkeleton() {
  return (
    <article
      className="flex flex-col rounded-[22px] border border-line bg-paper px-4 py-4 shadow-card lg:px-5 lg:py-5"
      aria-busy="true"
    >
      <Sk className="h-2.5 w-28" />
      <Sk className="mt-3.5 h-3.5 w-3/5" />
      <span className="mt-3.5 flex flex-col gap-1.5">
        <Sk className="h-2.5 w-full" />
        <Sk className="h-2.5 w-[88%]" />
        <Sk className="h-2.5 w-2/5" />
      </span>
      <span className="mt-4 flex items-center justify-between gap-3">
        <Sk className="h-2.5 w-24" />
        <Sk className="h-6 w-24 rounded-full" />
      </span>
    </article>
  );
}

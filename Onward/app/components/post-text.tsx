"use client";

import type { ReactNode } from "react";

/**
 * The little bit of markdown a person can type into an Exchange post, rendered back
 * into styled text. It is deliberately not a general markdown engine: it knows bold,
 * italics, code, dash bullets, numbered lists, quotes and headings, and nothing else.
 *
 * There is no HTML in here. Every piece of typed text comes back out as a React text
 * node, so a post containing "<script>" shows those characters the way it shows any
 * other characters.
 */

const BOLD = /\*\*(?=\S)([\s\S]*?\S)\*\*/g;
const ITALIC = /(?:\*|_)(?=\S)([\s\S]*?\S)(?:\*|_)/g;
const CODE = /`([^`\n]+)`/g;

type Mark = { from: number; to: number; kind: "bold" | "italic" | "code"; text: string };

/** One line of words, with bold, italics and code taken out of it. */
function inline(text: string, key: string): ReactNode[] {
  const marks: Mark[] = [];
  for (const [pattern, kind] of [
    [BOLD, "bold"],
    [ITALIC, "italic"],
    [CODE, "code"],
  ] as const) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      const inner = match[1];
      if (!inner) continue;
      // A mark inside another mark would need re-parsing, so the first one wins.
      if (marks.some((m) => match!.index >= m.from && match!.index < m.to)) continue;
      marks.push({ from: match.index, to: match.index + match[0].length, kind, text: inner });
    }
  }
  marks.sort((a, b) => a.from - b.from);

  const out: ReactNode[] = [];
  let cursor = 0;
  marks.forEach((mark, i) => {
    if (mark.from > cursor) out.push(text.slice(cursor, mark.from));
    if (mark.kind === "code") {
      out.push(
        <code key={`${key}m${i}`} className="rounded bg-cream px-1 py-0.5 font-mono text-[0.92em]">
          {mark.text}
        </code>,
      );
    } else {
      out.push(
        <span
          key={`${key}m${i}`}
          className={mark.kind === "bold" ? "font-bold text-ink" : "italic"}
        >
          {mark.text}
        </span>,
      );
    }
    cursor = mark.to;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

const BULLET = /^\s*[-•*]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const HEAD = /^#{1,3}\s+(.*)$/;

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "q"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; start: number; items: string[] };

const isGap = (block: Block) => block.kind === "p" && block.text === "";

/** Line by line, so what you see in the box is what comes out of it. */
function blocks(text: string): Block[] {
  const out: Block[] = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) {
      out.push({ kind: "p", text: "" });
      continue;
    }
    const head = line.match(HEAD);
    if (head) {
      out.push({ kind: "h", text: head[1]! });
      continue;
    }
    const quote = line.match(QUOTE);
    if (quote) {
      out.push({ kind: "q", text: quote[1]! });
      continue;
    }
    const bullet = line.match(BULLET);
    if (bullet) {
      const last = out[out.length - 1];
      if (last && last.kind === "ul") last.items.push(bullet[1]!);
      else out.push({ kind: "ul", items: [bullet[1]!] });
      continue;
    }
    const numbered = line.match(NUMBERED);
    if (numbered) {
      const last = out[out.length - 1];
      // The number a person typed is the number shown, so a list that starts at 3
      // still reads 3, 4, 5.
      if (last && last.kind === "ol") last.items.push(numbered[2]!);
      else out.push({ kind: "ol", start: Number(numbered[1]), items: [numbered[2]!] });
      continue;
    }
    out.push({ kind: "p", text: line });
  }
  while (out.length && isGap(out[out.length - 1]!)) out.pop();
  return out;
}

/**
 * Post text with its markdown shown. `className` goes on the wrapper so the card can
 * clamp it and the page a share link opens can let it run.
 */
export function PostText({ text, className = "" }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];

  blocks(text).forEach((block, i) => {
    const key = `b${i}`;
    if (block.kind === "p" && !block.text) {
      parts.push(<span key={key} className="block h-2" />);
      return;
    }
    if (block.kind === "p") {
      parts.push(
        <span key={key} className="block [overflow-wrap:anywhere]">
          {inline(block.text, key)}
        </span>,
      );
      return;
    }
    if (block.kind === "h") {
      parts.push(
        <span key={key} className="mt-1 block text-[13px] font-bold leading-[1.4] text-ink">
          {inline(block.text, key)}
        </span>,
      );
      return;
    }
    if (block.kind === "q") {
      parts.push(
        <span
          key={key}
          className="mt-1.5 block border-l-2 border-dash pl-2.5 text-[12px] italic leading-[1.55] text-inksoft"
        >
          {inline(block.text, key)}
        </span>,
      );
      return;
    }
    if (block.kind === "ul") {
      parts.push(
        <ul key={key} className="mt-1.5 space-y-1">
          {block.items.map((item, n) => (
            <li key={n} className="flex gap-2 [overflow-wrap:anywhere]">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-lime-deep" />
              <span>{inline(item, `${key}-${n}`)}</span>
            </li>
          ))}
        </ul>,
      );
      return;
    }
    parts.push(
      <ol key={key} className="mt-1.5 space-y-1">
        {block.items.map((item, n) => (
          <li key={n} className="flex gap-2 [overflow-wrap:anywhere]">
            <span className="shrink-0 font-semibold tabular-nums text-lime-deep">
              {block.start + n}.
            </span>
            <span>{inline(item, `${key}-${n}`)}</span>
          </li>
        ))}
      </ol>,
    );
  });

  return <div className={className}>{parts}</div>;
}

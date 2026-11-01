"use client";

import { useLayoutEffect, useRef } from "react";
import { Check } from "lucide-react";
import type { NoteLine } from "@/lib/checklist";
import { INDENT_PX } from "@/lib/checklist";

const ORDERED = /^(\d+)([.)])\s*/;

type Caret = { index: number; at: number | "end" };

/**
 * A note body where every line carries its own checkbox, so Enter makes the
 * next item instead of a wrapped paragraph. Prose lines stay editable too; they
 * simply have no box beside them.
 */
export function ChecklistEditor({
  lines,
  onChange,
  autoFocus = false,
  placeholder = "Add an item…",
}: {
  lines: NoteLine[];
  onChange: (lines: NoteLine[]) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const rows = useRef<(HTMLTextAreaElement | null)[]>([]);
  const caret = useRef<Caret | null>(autoFocus ? { index: 0, at: "end" } : null);

  useLayoutEffect(() => {
    rows.current.forEach((el) => {
      if (!el) return;
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    });
    const pending = caret.current;
    if (!pending) return;
    const el = rows.current[pending.index];
    if (el) {
      el.focus();
      const at = pending.at === "end" ? el.value.length : pending.at;
      el.setSelectionRange(at, at);
    }
    caret.current = null;
  }, [lines]);

  const write = (index: number, patch: Partial<NoteLine>) => {
    const next = lines.slice();
    next[index] = { ...next[index], ...patch } as NoteLine;
    onChange(next);
  };

  const insertAfter = (index: number, line: NoteLine, focus: Caret) => {
    const next = lines.slice();
    next.splice(index + 1, 0, line);
    caret.current = focus;
    onChange(next);
  };

  // Enter splits the current line at the caret, so the text after it is kept.
  const cut = (index: number, head: string, nextLine: NoteLine, focus: Caret) => {
    const next = lines.slice();
    next[index] = { ...next[index], text: head } as NoteLine;
    next.splice(index + 1, 0, nextLine);
    caret.current = focus;
    onChange(next);
  };

  const split = (index: number) => {
    const line = lines[index];
    const depth = line.depth ?? 0;
    const el = rows.current[index];
    const at = el === null ? line.text.length : el.selectionStart;
    // A split on a space leaves the space behind rather than in front of the
    // next item, where it would show up as a stray indent.
    const lead = /^\s+/.exec(line.text.slice(at))?.[0].length ?? 0;
    const head = line.text.slice(0, at + lead);
    const tail = line.text.slice(at + lead);

    // Enter on an empty marker gets you out of the list instead of stacking
    // blank rows, and Backspace on one deletes it.
    if (!head.trim() && !tail.trim()) {
      if (line.kind === "item") {
        const next = lines.slice();
        next[index] = { kind: "text", text: "", depth };
        caret.current = { index, at: 0 };
        onChange(next);
      } else {
        insertAfter(index, { kind: "text", text: "", depth }, { index: index + 1, at: 0 });
      }
      return;
    }

    if (line.kind === "item") {
      cut(index, head, { kind: "item", done: false, text: tail, depth }, { index: index + 1, at: 0 });
      return;
    }

    // "1. walk" + Enter hands "2. " to the line below.
    const ordered = ORDERED.exec(head);
    const marker = ordered ? `${Number(ordered[1]) + 1}${ordered[2]} ` : "";
    cut(index, head, { kind: "text", text: marker + tail, depth }, { index: index + 1, at: marker.length });
  };

  // Backspace with nothing selected walks the caret back through the list:
  // outdent first, then join the line above — never swallow what was typed.
  const mergeBackward = (index: number) => {
    const line = lines[index];
    const depth = line.depth ?? 0;
    if (depth > 0) {
      write(index, { depth: depth - 1 });
      return;
    }
    if (index === 0) return;
    const prev = lines[index - 1];
    const next = lines.slice();
    const joinAt = prev.text.length;
    next.splice(index, 1);
    next[index - 1] = { ...prev, text: prev.text + line.text };
    caret.current = { index: index - 1, at: joinAt };
    onChange(next);
  };

  const indent = (index: number, by: number) => {
    const depth = Math.max(0, Math.min(4, (lines[index].depth ?? 0) + by));
    write(index, { depth });
  };

  return (
    <div className="space-y-0.5">
      {lines.map((line, index) => (
        <div
          key={index}
          className="group flex items-start gap-2.5 rounded-xl px-1 py-1"
          style={{ paddingLeft: `${(line.depth ?? 0) * INDENT_PX + 4}px` }}
        >
          {line.kind === "item" ? (
            <button
              type="button"
              aria-label={line.done ? "Mark this item not done" : "Mark this item done"}
              aria-pressed={line.done}
              onClick={() => write(index, { done: !line.done })}
              className={`mt-[5px] flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition ${
                line.done
                  ? "border-lime-deep bg-lime"
                  : "border-dash bg-paper group-hover:border-lime-deep"
              }`}
            >
              {line.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
            </button>
          ) : (
            <span className="mt-[5px] h-5 w-1 shrink-0 border-l-2 border-line" aria-hidden />
          )}
          <textarea
            ref={(el) => {
              rows.current[index] = el;
            }}
            value={line.text}
            rows={1}
            aria-label={line.kind === "item" ? `Item ${index + 1}` : `Line ${index + 1}`}
            placeholder={line.kind === "item" ? placeholder : "Keep writing…"}
            onChange={(e) =>
              write(index, {
                text: line.kind === "item" ? e.target.value.replace(/\n/g, " ") : e.target.value,
              })
            }
            onKeyDown={(e) => {
              const el = e.currentTarget;
              const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                split(index);
                return;
              }
              if (e.key === "Backspace" && atStart) {
                if (index === 0 && !(line.depth ?? 0)) return;
                e.preventDefault();
                mergeBackward(index);
                return;
              }
              if (e.key === "Tab" && atStart) {
                // Only at the head of a line, so Tab still leaves the editor.
                e.preventDefault();
                indent(index, e.shiftKey ? -1 : 1);
              }
            }}
            className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-[15px] leading-[1.75] [overflow-wrap:anywhere] outline-none placeholder:text-faint lg:text-[16px] lg:leading-[1.8] ${
              line.kind === "item" && line.done ? "text-faint line-through" : "text-inksoft"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

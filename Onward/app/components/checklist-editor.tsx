"use client";

import { useLayoutEffect, useRef } from "react";
import { Check } from "lucide-react";
import type { NoteLine } from "@/lib/checklist";

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
  const focusNext = useRef<number | null>(autoFocus ? 0 : null);

  useLayoutEffect(() => {
    rows.current.forEach((el) => {
      if (!el) return;
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    });
    if (focusNext.current === null) return;
    rows.current[focusNext.current]?.focus();
    focusNext.current = null;
  }, [lines]);

  const write = (index: number, patch: Partial<NoteLine>) => {
    const next = lines.slice();
    next[index] = { ...next[index], ...patch } as NoteLine;
    onChange(next);
  };

  const insertAfter = (index: number) => {
    const next = lines.slice();
    next.splice(index + 1, 0, { kind: "item", done: false, text: "" });
    focusNext.current = index + 1;
    onChange(next);
  };

  const removeAt = (index: number) => {
    const next = lines.slice();
    next.splice(index, 1);
    focusNext.current = Math.max(0, index - 1);
    onChange(next);
  };

  return (
    <div className="space-y-0.5">
      {lines.map((line, index) => (
        <div key={index} className="group flex items-start gap-2.5 rounded-xl px-1 py-1">
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
              if (e.key === "Enter" && !e.shiftKey && line.kind === "item") {
                e.preventDefault();
                insertAfter(index);
                return;
              }
              if (
                e.key === "Backspace" &&
                el.selectionStart === 0 &&
                el.selectionEnd === 0 &&
                lines.length > 1
              ) {
                e.preventDefault();
                removeAt(index);
              }
            }}
            className={`w-full flex-1 resize-none overflow-hidden bg-transparent text-[15px] leading-[1.75] outline-none placeholder:text-faint lg:text-[16px] lg:leading-[1.8] ${
              line.kind === "item" && line.done ? "text-faint line-through" : "text-inksoft"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

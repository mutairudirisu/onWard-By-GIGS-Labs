"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Heading2, Italic, List, ListOrdered, Quote } from "lucide-react";

/**
 * What the post box is: a stretch of text you format the way it will read, not by
 * typing marks around it. Selections get bolded for real, and a format tapped with the
 * caret sitting in place carries whatever you type next.
 *
 * The markdown the card renders is only ever worked out from this on the way to the
 * database, so a post written here and one written by hand in marks come back the same.
 */

const BLOCKS = ["DIV", "P", "LI", "UL", "OL", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6"];
const isBlock = (tag: string) => BLOCKS.includes(tag);

function escapeHtml(text: string) {
  return text.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

const MARKS = /`([^`\n]+)`|\*\*([\s\S]+?)\*\*|[*_]([\s\S]+?)[*_]/g;

/** Words with the marks turned into the elements the box formats with. */
function inlineHtml(text: string): string {
  const out: string[] = [];
  let last = 0;
  MARKS.lastIndex = 0;
  for (let match = MARKS.exec(text); match; match = MARKS.exec(text)) {
    if (match.index > last) out.push(escapeHtml(text.slice(last, match.index)));
    if (match[1] !== undefined) out.push(`<code>${escapeHtml(match[1])}</code>`);
    else if (match[2] !== undefined) out.push(`<b>${escapeHtml(match[2])}</b>`);
    else out.push(`<i>${escapeHtml(match[3] ?? "")}</i>`);
    last = match.index + match[0].length;
  }
  out.push(escapeHtml(text.slice(last)));
  return out.join("");
}

/**
 * Markdown into the box. Line by line, because that is how the reader takes it apart
 * again, so what you see when a saved post comes back is what went in.
 */
export function toHtml(markdown: string): string {
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };

  for (const line of markdown.split("\n")) {
    const bullet = /^\s*[-•]\s+(.*)$/.exec(line);
    const numbered = /^\s*(\d{1,2})[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list !== "ul") {
        closeList();
        html.push("<ul>");
        list = "ul";
      }
      html.push(`<li>${inlineHtml(bullet[1] ?? "")}</li>`);
      continue;
    }
    if (numbered) {
      if (list !== "ol") {
        closeList();
        html.push("<ol>");
        list = "ol";
      }
      html.push(`<li>${inlineHtml(numbered[2] ?? "")}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) {
      html.push("<p><br></p>");
      continue;
    }
    const head = /^#{1,3}\s+(.*)$/.exec(line);
    if (head) {
      html.push(`<h2>${inlineHtml(head[1] ?? "")}</h2>`);
      continue;
    }
    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      html.push(`<blockquote>${inlineHtml(quote[1] ?? "")}</blockquote>`);
      continue;
    }
    html.push(`<p>${inlineHtml(line)}</p>`);
  }
  closeList();
  return html.join("");
}

/** A mark that only ever wraps words: a space stays outside it, or the reader would
 *  not see the mark at all. */
function wrap(token: string, inner: string): string {
  const lead = /^\s*/.exec(inner)?.[0] ?? "";
  const trail = /\s*$/.exec(inner)?.[0] ?? "";
  const core = inner.slice(lead.length, inner.length - trail.length);
  if (!core) return inner;
  return `${lead}${token}${core}${token}${trail}`;
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  if (el.tagName === "BR") return "\n";
  if (isBlock(el.tagName)) return Array.from(el.childNodes).map(block).join("\n");
  const inner = Array.from(el.childNodes).map(inline).join("");
  if (!inner) return "";
  if (el.tagName === "B" || el.tagName === "STRONG") return wrap("**", inner);
  if (el.tagName === "I" || el.tagName === "EM") return wrap("*", inner);
  if (el.tagName === "CODE" || el.tagName === "KBD") return wrap("`", inner);
  return inner;
}

function block(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  if (el.tagName === "BR") return "";
  if (el.tagName === "UL" || el.tagName === "OL") {
    const ordered = el.tagName === "OL";
    return Array.from(el.children)
      .map((item, i) => `${ordered ? `${i + 1}. ` : "- "}${inline(item).trim()}`)
      .join("\n");
  }
  if (el.tagName === "BLOCKQUOTE") {
    return inline(el)
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (/^H[1-6]$/.test(el.tagName)) return `## ${inline(el).trim()}`;
  return inline(el);
}

/** The box back into the markdown that gets stored. */
export function toMarkdown(root: HTMLElement): string {
  return Array.from(root.childNodes)
    .map(block)
    .join("\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Command = "bold" | "italic" | "head" | "quote" | "bullet" | "numbered";

const BUTTONS: { command: Command; label: string; Icon: typeof Bold }[] = [
  { command: "bold", label: "Bold", Icon: Bold },
  { command: "italic", label: "Italic", Icon: Italic },
  { command: "head", label: "Heading", Icon: Heading2 },
  { command: "bullet", label: "Bulleted list", Icon: List },
  { command: "numbered", label: "Numbered list", Icon: ListOrdered },
  { command: "quote", label: "Quote", Icon: Quote },
];

const FIELD =
  "w-full px-4 py-3 text-[13.5px] leading-[1.6] text-ink outline-none " +
  "[&_h2]:mt-2 [&_h2]:text-[14px] [&_h2]:font-bold [&_h2]:leading-[1.4] [&_h2]:tracking-tight " +
  "[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-dash [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:text-inksoft " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-0.5 " +
  "[&_code]:rounded [&_code]:bg-cream [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.92em] " +
  "[overflow-wrap:anywhere]";

/**
 * `onChange` carries the markdown, which is what the page stores; the box itself keeps
 * its own DOM and is only ever written to when it is still empty, so the caret is never
 * moved out from under you.
 */
export function PostEditor({
  initial = "",
  onChange,
  placeholder = "What did you get done, and what did it change?",
  max = 0,
  disabled = false,
  showToolbar = true,
  editorClassName = "min-h-[132px]",
}: {
  initial?: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  max: number;
  disabled?: boolean;
  showToolbar?: boolean;
  editorClassName?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const length = useRef(initial.trim().length);
  const [blank, setBlank] = useState(!initial.trim());
  const [on, setOn] = useState<Record<Command, boolean>>({
    bold: false,
    italic: false,
    head: false,
    quote: false,
    bullet: false,
    numbered: false,
  });

  function read() {
    const el = box.current;
    if (!el) return;
    const markdown = toMarkdown(el);
    length.current = markdown.length;
    setBlank(!markdown);
    onChange(markdown);
  }

  function states() {
    const el = box.current;
    if (!el) return;
    const inside = document.getSelection()?.anchorNode
      ? el.contains(document.getSelection()!.anchorNode)
      : false;
    if (!inside) return;
    const format = (document.queryCommandValue("formatBlock") ?? "").toLowerCase();
    setOn({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      head: /^h[1-6]$/.test(format),
      quote: format === "blockquote",
      bullet: document.queryCommandState("insertUnorderedList"),
      numbered: document.queryCommandState("insertOrderedList"),
    });
  }

  // The caret moves with taps, arrow keys and typing, and every one of those should
  // say what the box would do to the next word.
  useEffect(() => {
    document.addEventListener("selectionchange", states);
    return () => document.removeEventListener("selectionchange", states);
  });

  // Only ever fills a box nobody has typed in, which is how the words carried over from
  // an onWard get in, and how a draft comes back after a detour into the poll form.
  useEffect(() => {
    const el = box.current;
    if (!el || !initial.trim()) return;
    if (toMarkdown(el)) return;
    el.innerHTML = toHtml(initial);
    length.current = initial.trim().length;
    setBlank(false);
  }, [initial]);

  function run(command: Command) {
    const el = box.current;
    if (!el || disabled) return;
    el.focus();
    if (command === "bold" || command === "italic") {
      document.execCommand(command);
    } else if (command === "bullet" || command === "numbered") {
      document.execCommand(command === "bullet" ? "insertUnorderedList" : "insertOrderedList");
    } else {
      const want = command === "head" ? "h2" : "blockquote";
      const current = (document.queryCommandValue("formatBlock") ?? "").toLowerCase();
      document.execCommand("formatBlock", false, current === want ? "<p>" : `<${want}>`);
    }
    states();
    read();
  }

  return (
    <>
      <div className="relative">
        <div
          ref={box}
          role="textbox"
          aria-multiline="true"
          aria-label="Post text"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={read}
          onBlur={read}
          onKeyUp={states}
          onMouseUp={states}
          onPaste={(event) => {
            // Only words come in: a page's own bold, fonts and tables would be
            // markup the reader has no way to know about.
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            if (!text) return;
            const room = max ? max - length.current : text.length;
            if (room <= 0) return;
            document.execCommand("insertText", false, room >= text.length ? text : text.slice(0, room));
            read();
          }}
          onBeforeInput={(event) => {
            const input = event.nativeEvent as Event & {
              inputType?: string;
              data?: string | null;
            };
            if (!max || typeof input.inputType !== "string" || !input.inputType.startsWith("insert")) {
              return;
            }
            const added = input.data?.length ?? (input.inputType === "insertParagraph" ? 1 : 0);
            if (length.current + added > max) event.preventDefault();
          }}
          className={`${FIELD} wheel ${editorClassName} whitespace-pre-wrap`}
        />
        {blank ? (
          <span className="pointer-events-none absolute left-4 top-3 text-[13.5px] leading-[1.6] text-faint">
            {placeholder}
          </span>
        ) : null}
      </div>

      {showToolbar ? (
        <div className="flex items-center gap-0.5 border-t border-line px-2 py-1.5">
          {BUTTONS.map(({ command, label, Icon }) => (
            <button
              key={command}
              type="button"
              aria-label={label}
              aria-pressed={on[command]}
              title={label}
              disabled={disabled}
              // The box keeps the selection the button is about to format.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run(command)}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-cream disabled:cursor-not-allowed disabled:text-faint ${
                on[command] ? "bg-lime-pale text-ink" : "text-inksoft hover:text-ink"
              }`}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={2.1} />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

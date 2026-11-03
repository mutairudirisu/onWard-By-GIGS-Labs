/**
 * Notes are plain text, so a checklist is stored as markdown task items
 * (`- [ ] buy milk`) inside the body column. That keeps the existing sync,
 * the .md export and the search box working without another table.
 */

const ITEM = /^(\s*)-\s*\[([ xX])\]\s?(.*)$/;
/** `1. ` or `1) `, with whatever indent the line carries. */
export const ORDERED_PATTERN = /^(\s*)(\d+)([.)])\s+(.*)$/;

/** What the toolbar makes a line into. */
export type LineShape = "item" | "ordered" | "plain";

/** Two spaces per level, so a nested item keeps its place on the round trip. */
const INDENT = "  ";

/** What one level of that indent looks like on screen. */
export const INDENT_PX = 16;

export type NoteLine =
  | { kind: "item"; done: boolean; text: string; depth?: number }
  | { kind: "text"; text: string; depth?: number };

function depthOf(leading: string) {
  return Math.floor(leading.length / INDENT.length);
}

export function parseNote(body: string): NoteLine[] {
  return body.split("\n").map((raw) => {
    const match = ITEM.exec(raw);
    return match
      ? {
          kind: "item",
          done: match[2] !== " ",
          text: match[3],
          depth: depthOf(match[1]),
        }
      : { kind: "text", text: raw.trimStart(), depth: depthOf(/^\s*/.exec(raw)?.[0] ?? "") };
  });
}

export function lineToSource(line: NoteLine): string {
  const pad = INDENT.repeat(Math.max(0, line.depth ?? 0));
  if (line.kind !== "item") return `${pad}${line.text}`;
  return `${pad}- [${line.done ? "x" : " "}] ${line.text}`;
}

export function noteToBody(lines: NoteLine[]): string {
  return lines.map(lineToSource).join("\n");
}

export function hasChecklist(body: string): boolean {
  return body.split("\n").some((line) => ITEM.test(line));
}

export function toggleLine(body: string, index: number): string {
  const lines = parseNote(body);
  const line = lines[index];
  if (!line || line.kind !== "item") return body;
  lines[index] = { ...line, done: !line.done };
  return noteToBody(lines);
}

export function progress(body: string): { done: number; total: number } | null {
  const items = parseNote(body).filter(
    (line): line is Extract<NoteLine, { kind: "item" }> => line.kind === "item",
  );
  if (!items.length) return null;
  return { done: items.filter((i) => i.done).length, total: items.length };
}

/** The line's own words, with any list marker taken off. */
export function stripMarker(text: string): string {
  const item = ITEM.exec(text);
  if (item) return item[3];
  const ordered = ORDERED_PATTERN.exec(text);
  if (ordered) return ordered[4];
  return text.trimStart();
}

/** The number a marker at this position should carry, so the list stays in order. */
export function orderedNumber(lines: NoteLine[], index: number): number {
  return lines.slice(0, index).filter((l) => l.kind === "text" && ORDERED_PATTERN.test(l.text)).length + 1;
}

/** The same line rewritten as a tickable item, a numbered line, or prose. */
export function shapeLine(line: NoteLine, shape: LineShape, number: number): NoteLine {
  const text = stripMarker(line.text);
  const depth = line.depth ?? 0;
  if (shape === "item") {
    return { kind: "item", done: line.kind === "item" ? line.done : false, text, depth };
  }
  if (shape === "ordered") return { kind: "text", text: number ? `${number}. ${text}` : text, depth };
  return { kind: "text", text, depth };
}

/** Strip the task markers, keeping the tick state as a glyph. */
export function asProse(body: string): string {
  return parseNote(body)
    .map((line) =>
      line.kind === "item" ? `${line.done ? "☑" : "☐"} ${line.text}` : line.text,
    )
    .join("\n");
}

/** Tick or clear every item — how a task and its steps stay in agreement. */
export function setAllDone(source: string, done: boolean): string {
  return noteToBody(parseNote(source).map((line) => (line.kind === "item" ? { ...line, done } : line)));
}

/** How far through a task's steps it is, or null when it has none. */
export function stepProgress(steps?: string): { done: number; total: number } | null {
  if (!steps?.trim()) return null;
  const items = parseNote(steps).filter((line) => line.kind === "item" && line.text.trim());
  if (!items.length) return null;
  return { done: items.filter((line) => line.kind === "item" && line.done).length, total: items.length };
}

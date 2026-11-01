/**
 * Notes are plain text, so a checklist is stored as markdown task items
 * (`- [ ] buy milk`) inside the body column. That keeps the existing sync,
 * the .md export and the search box working without another table.
 */

const ITEM = /^\s*-\s*\[([ xX])\]\s?(.*)$/;

export const CHECKLIST_PREFIX = "- [ ] ";

export type NoteLine =
  | { kind: "item"; done: boolean; text: string }
  | { kind: "text"; text: string };

export function parseNote(body: string): NoteLine[] {
  return body.split("\n").map((raw) => {
    const match = ITEM.exec(raw);
    return match
      ? { kind: "item", done: match[1] !== " ", text: match[2] }
      : { kind: "text", text: raw };
  });
}

export function lineToSource(line: NoteLine): string {
  if (line.kind !== "item") return line.text;
  return `- [${line.done ? "x" : " "}] ${line.text}`;
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

/** Turn a plain note into a checklist, leaving existing items alone. */
export function asChecklist(body: string): string {
  return body
    .split("\n")
    .map((line) => (ITEM.test(line) || !line.trim() ? line : `${CHECKLIST_PREFIX}${line}`))
    .join("\n");
}

/** Strip the task markers, keeping the tick state as a glyph. */
export function asProse(body: string): string {
  return parseNote(body)
    .map((line) =>
      line.kind === "item" ? `${line.done ? "☑" : "☐"} ${line.text}` : line.text,
    )
    .join("\n");
}

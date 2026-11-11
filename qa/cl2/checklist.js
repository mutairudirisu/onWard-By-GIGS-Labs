"use strict";
/**
 * Notes are plain text, so a checklist is stored as markdown task items
 * (`- [ ] buy milk`) inside the body column. That keeps the existing sync,
 * the .md export and the search box working without another table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDENT_PX = exports.ORDERED_PATTERN = void 0;
exports.parseNote = parseNote;
exports.lineToSource = lineToSource;
exports.noteToBody = noteToBody;
exports.hasChecklist = hasChecklist;
exports.toggleLine = toggleLine;
exports.progress = progress;
exports.stripMarker = stripMarker;
exports.orderedNumber = orderedNumber;
exports.shapeLine = shapeLine;
exports.asProse = asProse;
exports.setAllDone = setAllDone;
exports.stepProgress = stepProgress;
const ITEM = /^(\s*)-\s*\[([ xX])\]\s?(.*)$/;
/** `1. ` or `1) `, with whatever indent the line carries. */
exports.ORDERED_PATTERN = /^(\s*)(\d+)([.)])\s+(.*)$/;
/** Two spaces per level, so a nested item keeps its place on the round trip. */
const INDENT = "  ";
/** What one level of that indent looks like on screen. */
exports.INDENT_PX = 16;
function depthOf(leading) {
    return Math.floor(leading.length / INDENT.length);
}
function parseNote(body) {
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
function lineToSource(line) {
    const pad = INDENT.repeat(Math.max(0, line.depth ?? 0));
    if (line.kind !== "item")
        return `${pad}${line.text}`;
    return `${pad}- [${line.done ? "x" : " "}] ${line.text}`;
}
function noteToBody(lines) {
    return lines.map(lineToSource).join("\n");
}
function hasChecklist(body) {
    return body.split("\n").some((line) => ITEM.test(line));
}
function toggleLine(body, index) {
    const lines = parseNote(body);
    const line = lines[index];
    if (!line || line.kind !== "item")
        return body;
    lines[index] = { ...line, done: !line.done };
    return noteToBody(lines);
}
function progress(body) {
    const items = parseNote(body).filter((line) => line.kind === "item");
    if (!items.length)
        return null;
    return { done: items.filter((i) => i.done).length, total: items.length };
}
/** The line's own words, with any list marker taken off. */
function stripMarker(text) {
    const item = ITEM.exec(text);
    if (item)
        return item[3];
    const ordered = exports.ORDERED_PATTERN.exec(text);
    if (ordered)
        return ordered[4];
    return text.trimStart();
}
/** The number a marker at this position should carry, so the list stays in order. */
function orderedNumber(lines, index) {
    return lines.slice(0, index).filter((l) => l.kind === "text" && exports.ORDERED_PATTERN.test(l.text)).length + 1;
}
/** The same line rewritten as a tickable item, a numbered line, or prose. */
function shapeLine(line, shape, number) {
    const text = stripMarker(line.text);
    const depth = line.depth ?? 0;
    if (shape === "item") {
        return { kind: "item", done: line.kind === "item" ? line.done : false, text, depth };
    }
    if (shape === "ordered")
        return { kind: "text", text: number ? `${number}. ${text}` : text, depth };
    return { kind: "text", text, depth };
}
/** Strip the task markers, keeping the tick state as a glyph. */
function asProse(body) {
    return parseNote(body)
        .map((line) => line.kind === "item" ? `${line.done ? "☑" : "☐"} ${line.text}` : line.text)
        .join("\n");
}
/** Tick or clear every item — how a task and its steps stay in agreement. */
function setAllDone(source, done) {
    return noteToBody(parseNote(source).map((line) => (line.kind === "item" ? { ...line, done } : line)));
}
/** How far through a task's steps it is, or null when it has none. */
function stepProgress(steps) {
    if (!steps?.trim())
        return null;
    const items = parseNote(steps).filter((line) => line.kind === "item" && line.text.trim());
    if (!items.length)
        return null;
    return { done: items.filter((line) => line.kind === "item" && line.done).length, total: items.length };
}

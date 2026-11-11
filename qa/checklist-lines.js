// Mirrors the ChecklistEditor line operations against the real checklist.ts so
// the storage round trip is proven without a browser.
const {
  parseNote,
  noteToBody,
  hasChecklist,
  progress,
  ORDERED_PATTERN,
  stripMarker,
  orderedNumber,
  shapeLine,
} = require("./cl2/checklist.js");

function cut(lines, index, el) {
  const line = lines[index];
  const depth = line.depth ?? 0;
  const at = el === null ? line.text.length : el.selectionStart;
  const lead = /^\s+/.exec(line.text.slice(at))?.[0].length ?? 0;
  const head = line.text.slice(0, at + lead);
  const tail = line.text.slice(at + lead);
  const next = lines.slice();

  if (!head.trim() && !tail.trim()) {
    if (line.kind === "item") {
      next[index] = { kind: "text", text: "", depth };
      return next;
    }
    next.splice(index + 1, 0, { kind: "text", text: "", depth });
    return next;
  }

  if (line.kind === "item") {
    next[index] = { ...line, text: head };
    next.splice(index + 1, 0, { kind: "item", done: false, text: tail, depth });
    return next;
  }

  const ordered = ORDERED_PATTERN.exec(head);
  const marker = ordered ? `${Number(ordered[2]) + 1}${ordered[3]} ` : "";
  next[index] = { ...line, text: head };
  next.splice(index + 1, 0, { kind: "text", text: marker + tail, depth });
  return next;
}

function mergeBackward(lines, index) {
  const line = lines[index];
  const depth = line.depth ?? 0;
  if (depth > 0) {
    const next = lines.slice();
    next[index] = { ...line, depth: depth - 1 };
    return next;
  }
  if (index === 0) return lines;
  const prev = lines[index - 1];
  const next = lines.slice();
  next.splice(index, 1);
  next[index - 1] = { ...prev, text: prev.text + line.text };
  return next;
}

let failures = 0;
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`ok   ${name}`);
  else {
    console.log(`FAIL ${name}\n     got      ${a}\n     expected ${e}`);
    failures++;
  }
};

// 1. nested checklist survives a round trip untouched
const nested = "- [ ] root\n  - [x] child\n    - [ ] grandchild\nsome prose\n  1. numbered";
check("round trip is stable", noteToBody(parseNote(nested)), nested);
check(
  "depths parse",
  parseNote(nested).map((l) => l.depth),
  [0, 1, 2, 0, 1],
);

// 2. Enter mid-item splits at the caret, keeps the tail, and leaves the space
//    behind on the line it came from
const body2 = "- [ ] buy milk today";
const split2 = cut(parseNote(body2), 0, { selectionStart: 8 });
check("item split keeps both halves", noteToBody(split2), "- [ ] buy milk \n- [ ] today");

// 3. Enter on an empty item leaves the list
check(
  "empty item becomes a plain line",
  noteToBody(cut(parseNote("- [ ]\n- [ ] next"), 0, { selectionStart: 0 })),
  "\n- [ ] next",
);

// 4. Enter on a numbered line continues the number
const numbered = "1. walk the dog";
check(
  "numbering continues",
  noteToBody(cut(parseNote(numbered), 0, { selectionStart: numbered.length })),
  "1. walk the dog\n2. ",
);

// 5. Backspace at column 0 outdents before it merges
const indented = "- [ ] parent\n  - [ ] kid";
const indentedLines = parseNote(indented);
check(
  "backspace outdents a nested item",
  noteToBody(mergeBackward(indentedLines, 1)),
  "- [ ] parent\n- [ ] kid",
);
check(
  "backspace merges instead of deleting",
  noteToBody(mergeBackward(parseNote("- [ ] parent\n- [ ] kid"), 1)),
  "- [ ] parentkid",
);

// 6. a long unbreakable token is not lost or re-wrapped by the serialiser
const ugly = "x".repeat(90);
check("long token survives", noteToBody(parseNote(ugly)), ugly);
check("prose with an item still reads as a checklist", hasChecklist(`${ugly}\n- [ ] real`), true);
check(
  "progress counts only items",
  progress(`${ugly}\n- [x] one\n- [ ] two`),
  { done: 1, total: 2 },
);

// 7. ticking through the editor patch path
const ticked = parseNote(nested).map((l, i) => (i === 0 ? { ...l, done: true } : l));
check("tick writes the marker", noteToBody(ticked).split("\n")[0], "- [x] root");

// 8. the toolbar rewrites the line the caret is on, keeping its words and indent
check(
  "prose becomes an item",
  shapeLine({ kind: "text", text: "buy milk", depth: 0 }, "item", 1),
  { kind: "item", done: false, text: "buy milk", depth: 0 },
);
check(
  "item becomes plain prose",
  shapeLine({ kind: "item", done: true, text: "buy milk", depth: 1 }, "plain", 3),
  { kind: "text", text: "buy milk", depth: 1 },
);
check(
  "item becomes a numbered line",
  shapeLine({ kind: "item", done: false, text: "wash", depth: 0 }, "ordered", 2),
  { kind: "text", text: "2. wash", depth: 0 },
);
check(
  "re-shaping a ticked item keeps the tick",
  shapeLine({ kind: "item", done: true, text: "wash", depth: 0 }, "item", 1).done,
  true,
);
check("stripMarker takes any marker off", ["- [ ] a", "3) b", "  c"].map(stripMarker), ["a", "b", "c"]);

// 9. the number handed to a numbered line follows the ones already above it
const mixed = parseNote("1. one\n- [ ] not a number\n2. two\nprose\n3. three");
check(
  "counting skips items and prose",
  [1, 2, 4, 5].map((i) => orderedNumber(mixed, i)),
  [2, 2, 3, 4],
);

// 10. a shaped line still round-trips through the body column
const shaped = shapeLine(parseNote("  - [x] kid")[0], "ordered", 2);
check(
  "shaped line serialises with its indent",
  noteToBody([parseNote(nested)[0], shaped]).split("\n")[1],
  "  2. kid",
);

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);

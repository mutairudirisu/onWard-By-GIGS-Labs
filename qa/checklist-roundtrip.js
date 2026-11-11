const { parseNote, noteToBody, hasChecklist, CHECKLIST_PREFIX } = require("./checklist.js");

const body = [
  "- [x] Mon standup",
  "  - [ ] gym",
  "    - [ ] pack bag",
  "just prose",
  "- [ ] read chapter 4",
].join("\n");

const lines = parseNote(body);
const back = noteToBody(lines);

console.log("hasChecklist:", hasChecklist(body));
console.log("depths:", lines.map((l) => `${l.kind}:${l.depth ?? 0}`).join(" "));
console.log("round trip exact:", back === body);
if (back !== body) console.log("got:\n" + back);

// Ticking the nested item must not flatten the list.
const flipped = lines.map((l) => (l.text === "gym" ? { ...l, done: true } : l));
const ticked = noteToBody(flipped);
console.log("after tick nested:", JSON.stringify(ticked.split("\n")[1]));
console.log("prefix constant:", JSON.stringify(CHECKLIST_PREFIX));

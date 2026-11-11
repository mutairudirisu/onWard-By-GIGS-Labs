// Renders the same markup the note editor produces, using the app's compiled
// Tailwind CSS and the real lucide icon geometry, so the toolbar and the pinned
// action bar can be measured in a browser without a signed-in session.
const fs = require("fs");
const path = require("path");

const APP = path.resolve(__dirname, "../Onward/app");
const css = fs
  .readdirSync(path.join(APP, ".next/static/css"))
  .map((f) => path.join(APP, ".next/static/css", f))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

function icon(name, cls = "", sw = 2) {
  const src = fs.readFileSync(path.join(APP, `node_modules/lucide-react/dist/esm/icons/${name}.js`), "utf8");
  const inner = [...src.matchAll(/\["([a-z]+)",\s*\{([^}]*)\}\]/g)]
    .map(([, tag, attrs]) => {
      const a = [...attrs.matchAll(/(\w+):\s*"([^"]*)"/g)]
        .filter(([, k]) => k !== "key")
        .map(([, k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const INDENT_PX = 16;

// parseNote() output for a note half-written as a checklist.
const lines = [
  { kind: "item", done: true, text: "Draft the three-slide intro", depth: 0 },
  { kind: "item", done: false, text: "Book the room", depth: 1 },
  { kind: "item", done: false, text: "Send the invite list to Tolu", depth: 0 },
  { kind: "text", text: "1. parking pass at reception", depth: 0 },
  { kind: "text", text: "Notes for the run-through", depth: 0 },
  { kind: "item", done: false, text: "x".repeat(64), depth: 0 },
  { kind: "item", done: false, text: "Print the handout", depth: 0 },
  { kind: "item", done: false, text: "Charge the clicker", depth: 0 },
];

const rows = lines
  .map((line, i) => {
    const box =
      line.kind === "item"
        ? `<button type="button" aria-label="${line.done ? "Mark this item not done" : "Mark this item done"}" aria-pressed="${line.done}" class="mt-[5px] flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition ${line.done ? "border-lime-deep bg-lime" : "border-dash bg-paper group-hover:border-lime-deep"}">${line.done ? icon("check", "h-3 w-3 text-dark", 3) : ""}</button>`
        : `<span class="mt-[5px] h-5 w-1 shrink-0 border-l-2 border-line" aria-hidden="true"></span>`;
    const ph = line.kind === "item" ? "Add an item…" : "Keep writing…";
    return `
      <div class="group flex items-start gap-2.5 rounded-xl px-1" style="padding-left:${line.depth * INDENT_PX + 4}px">
        ${box}
        <textarea rows="1" aria-label="${line.kind === "item" ? `Item ${i + 1}` : `Line ${i + 1}`}" placeholder="${ph}" class="min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-[15px] leading-[1.75] [overflow-wrap:anywhere] outline-none placeholder:text-faint ${line.kind === "item" && line.done ? "text-faint line-through" : "text-inksoft"}">${line.text}</textarea>
      </div>`;
  })
  .join("");

const tool = (label, svg) =>
  `<button type="button" aria-label="${label}" title="${label}" class="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream active:scale-95">${svg}</button>`;

const html = `<!doctype html>
<html lang="en" class="${process.argv.includes("--dark") ? "dark" : ""}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="${css.replace(/\\/g, "/")}">
<title>Note toolbar harness</title>
</head>
<body class="${process.argv.includes("--dark") ? "dark" : ""}">
<div id="shell" class="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-cream">
  <div class="flex min-h-dvh flex-1 flex-col">
    <main class="flex-1 px-5 pt-5 pb-32">
      <div class="mx-auto w-full max-w-none">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-1">
            <button type="button" aria-label="Back to notes" class="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-inksoft hover:bg-cream"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>
            <h1 class="text-[17px] font-bold tracking-tight text-ink">Note</h1>
            <span class="ml-1 flex items-center gap-1 text-[9px] font-semibold text-lime-deep"><span class="h-1.5 w-1.5 rounded-full bg-lime-deep"></span>Unsaved</span>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" aria-label="Pin note" class="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream">${icon("pin", "h-[18px] w-[18px]")}</button>
            <button type="button" aria-label="Share note" class="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream">${icon("share-2", "h-[18px] w-[18px]")}</button>
            <button type="button" aria-label="Note options" class="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream">${icon("more-horizontal", "h-[18px] w-[18px]")}</button>
          </div>
        </div>
        <div class="lg:max-w-[760px]">
          <input value="Thursday run-through" aria-label="Note title" class="w-full bg-transparent text-[27px] font-bold leading-[1.15] tracking-[-0.02em] text-ink outline-none placeholder:text-faint">
          <p class="mb-4 mt-2 text-[10px] font-medium text-muted">Tue 3 Nov, 8:14 am · 214 characters</p>
          <div class="space-y-1.5">${rows}</div>
          <div class="h-44" aria-hidden="true"></div>
        </div>
      </div>
    </main>
    <div id="bar" class="fixed inset-x-0 z-40 mx-auto w-full max-w-[400px] border-t border-line/70 bg-paper/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur transition-[bottom] duration-150" style="bottom:0">
      <div class="mb-1.5 flex items-center justify-center gap-1">
        <button type="button" aria-label="Dictate note" title="Dictate note" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-inksoft hover:bg-cream">${icon("mic", "h-[16px] w-[16px]", 2.2)}</button>
        ${tool("Tickable item", icon("square-check", "h-[18px] w-[18px]", 2))}
        ${tool("Numbered line", icon("list-ordered", "h-[18px] w-[18px]", 2))}
        ${tool("Plain line", icon("type", "h-[18px] w-[18px]", 2))}
      </div>
      <div class="flex gap-2">
        <button type="button" class="flex w-full flex-1 items-center justify-center gap-2 rounded-btn px-4 py-3 text-[13px] font-semibold transition active:scale-[0.99] bg-lime text-dark hover:bg-lime-deep">${icon("check-check", "h-4 w-4")}Save note</button>
        <button type="button" class="flex w-full flex-1 items-center justify-center gap-2 rounded-btn px-4 py-3 text-[13px] font-semibold transition active:scale-[0.99] border border-line bg-paper text-ink hover:bg-cream">Discard</button>
      </div>
    </div>
  </div>
</div>
<script>
  // Same auto-grow the editor does on every render.
  document.querySelectorAll("textarea").forEach((el) => {
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, process.argv.includes("--dark") ? "note-toolbar-dark.html" : "note-toolbar.html"), html);
console.log(`${css} -> harness written`);

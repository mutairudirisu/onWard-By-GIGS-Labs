// Renders the same markup the new notes/onWards cards and bottom nav produce,
// using the app's compiled Tailwind CSS and real lucide icon geometry, so the
// day-grouped layout and the taller nav can be measured without a signed-in session.
const fs = require("fs");
const path = require("path");

const APP = path.resolve(__dirname, "../Onward/app");
const css = fs
  .readdirSync(path.join(APP, ".next/static/css"))
  .map((f) => path.join(APP, ".next/static/css", f))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

const dark = process.argv.includes("--dark");

function icon(name, cls = "", sw = 2) {
  const src = fs.readFileSync(
    path.join(APP, `node_modules/lucide-react/dist/esm/icons/${name}.js`),
    "utf8",
  );
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

const KIND_ICON = { file: "file-text", url: "globe", image: "image" };

// ---------------------------------------------------------------- notes cards
const noteCards = [
  {
    tag: "Work",
    title: "Atlas onboarding reflections",
    excerpt:
      "What worked, what surprised us, and how we cut time-to-ready from 5 days to 3.",
    list: { done: 2, total: 5 },
    time: "9:19 AM",
    pale: true,
  },
  {
    tag: "Personal",
    title: "A calmer Monday",
    excerpt: "Protect an hour for deep work. One clear priority is better than ten open tabs.",
    list: null,
    time: "7:02 AM",
  },
  {
    tag: "Career",
    title: "Questions for my next 1:1 with Priya before the November cohort review",
    excerpt:
      "Talk about the operations exec push. Bring examples of the onboarding project and the time-to-ready numbers. Ask what “exceptional” looks like at the next level, and whether the portfolio review can move a week earlier.",
    list: { done: 0, total: 3 },
    time: "6:41 PM",
  },
];

const noteCard = (n) => `
  <a href="#" class="flex flex-col rounded-[22px] border px-4 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${n.pale ? "border-lime-deep/40 bg-lime-pale" : "border-line bg-paper"}">
    <div class="flex items-start justify-between gap-3">
      <p class="text-[11px] font-semibold text-muted">${n.tag}</p>
      ${n.pale ? icon("pin", "h-4 w-4 shrink-0 fill-lime-deep text-lime-deep") : ""}
    </div>
    <h3 class="mt-1 text-[15px] font-bold tracking-tight text-ink [overflow-wrap:anywhere]">${n.title}</h3>
    <p class="mt-1.5 line-clamp-3 flex-1 text-[11.5px] leading-[1.65] text-inksoft">${n.excerpt}</p>
    <div class="mt-3.5 flex items-center justify-between gap-3">
      <span class="text-[10.5px] font-semibold text-muted">${n.list ? `${n.list.done} of ${n.list.total} done` : ""}</span>
      <span class="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-paper">${icon("clock", "h-3 w-3")}${n.time}</span>
    </div>
  </a>`;

// --------------------------------------------------------------- onWard cards
const wardCards = [
  {
    skills: ["Stakeholder management", "Documentation", "Data analysis", "Communication"],
    title: "A smoother start for new hires",
    impact:
      "Cut time-to-ready from 5 days to 3 by bringing every handoff into one checklist with a clear owner at each step.",
    evidence: [["image", 2], ["file", 1], ["url", 1]],
    portfolio: true,
    date: "03 Nov",
  },
  {
    skills: ["Spreadsheets"],
    title: "Weekly numbers, without the Sunday night scramble",
    impact: "One sheet, one formula set, twelve hours back every month.",
    evidence: [["file", 3]],
    portfolio: false,
    date: "03 Nov",
  },
  {
    skills: ["Documentation", "Communication"],
    title: "The runbook that outlived its author",
    impact: "Wrote the escalation runbook two days before handover; support still uses it.",
    evidence: [],
    portfolio: false,
    date: "30 Oct",
  },
];

const wardCard = (w) => `
  <div class="relative flex flex-col rounded-[22px] border border-line bg-paper px-4 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
    <a href="#" aria-label="Open ${w.title}" class="absolute inset-0 rounded-[inherit]"></a>
    <div class="flex items-start justify-between gap-3">
      <p class="text-[11px] font-semibold text-muted">${w.skills.slice(0, 2).join(" · ")}${w.skills.length > 2 ? ` +${w.skills.length - 2}` : ""}</p>
      <button type="button" aria-label="Add to favourites" class="relative z-10 -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90">${icon("star", "h-4 w-4 text-faint")}</button>
    </div>
    <h3 class="mt-1 text-[15px] font-bold tracking-tight text-ink [overflow-wrap:anywhere]">${w.title}</h3>
    <p class="mt-1.5 line-clamp-3 flex-1 text-[11.5px] leading-[1.65] text-inksoft">${w.impact}</p>
    <div class="mt-3.5 flex items-end justify-between gap-3">
      <span class="flex items-center gap-2.5 text-[10.5px] font-semibold text-muted">${w.evidence
        .map(
          ([kind, n]) =>
            `<span class="flex items-center gap-1" title="${n} ${kind}">${icon(KIND_ICON[kind], "h-3.5 w-3.5")}${n}</span>`,
        )
        .join("")}${w.portfolio ? '<span class="text-lime-deep">Portfolio</span>' : ""}</span>
      <span class="flex items-center gap-2">
        <span class="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-paper">${icon("calendar-days", "h-3 w-3")}${w.date}</span>
        <button type="button" aria-label="Share" class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-inksoft transition hover:bg-lime-soft active:scale-90">${icon("share-2", "h-[15px] w-[15px]")}</button>
      </span>
    </div>
  </div>`;

const sectionHead = (heading, caption) => `
  <div class="mb-3 flex items-center gap-3">
    <h2 class="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">${heading}</h2>
    <span class="h-px flex-1 bg-line"></span>
    <span class="text-[11px] font-medium text-faint">${caption}</span>
  </div>`;

const chip = (label, active) =>
  `<button type="button" class="chip transition hover:border-dash ${active ? "chip-active" : "bg-transparent"}">${label}</button>`;

const search = (placeholder) => `
  <div class="relative">
    ${icon("search", "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint")}
    <input class="field-input pl-9 pr-9" placeholder="${placeholder}">
  </div>`;

// ------------------------------------------------------------------- bottom nav
const TABS = [
  ["home", "Today", false],
  ["list-checks", "Tasks", false],
  ["notebook-pen", "Notes", true],
  ["sprout", "onWards", false],
  ["user", "You", false],
];

const nav = `
  <nav id="nav" class="relative z-40 bg-cream px-4 pb-2.5 pt-2.5">
    <div class="flex items-center gap-2.5">
      <div id="pill" class="flex flex-1 items-center justify-between rounded-full bg-paper px-2 py-2 shadow-[0_10px_30px_rgba(16,17,8,0.08)]">
        ${TABS.map(
          ([ic, label, active]) =>
            active
              ? `<a href="#" aria-current="page" id="active-tab" class="flex items-center gap-1.5 rounded-full bg-line py-2.5 pl-3.5 pr-4"><span class="relative flex">${icon(ic, "h-[18px] w-[18px] text-lime-deep", 2.2)}</span><span class="text-[11px] font-bold text-lime-deep">${label}</span></a>`
              : `<a href="#" aria-label="${label}" class="flex h-11 w-11 items-center justify-center rounded-full text-faint transition hover:text-lime-deep"><span class="relative flex">${icon(ic, "h-[18px] w-[18px]")}</span></a>`,
        ).join("")}
      </div>
      <div class="relative z-50">
        <button type="button" aria-label="Create something new" id="fab" class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-lime text-dark shadow-[0_10px_30px_rgba(16,17,8,0.15)] transition active:scale-95">${icon("plus", "h-[22px] w-[22px]", 2.4)}</button>
      </div>
    </div>
  </nav>
  <div id="indicator" class="flex justify-center pb-2 pt-3"><span class="h-[5px] w-32 rounded-full bg-ink"></span></div>`;

const html = `<!doctype html>
<html lang="en" class="${dark ? "dark" : ""}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="${css.replace(/\\/g, "/")}">
<title>Timeline cards harness</title>
</head>
<body class="${dark ? "dark" : ""}">
<div class="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-cream">
  <main id="main" class="flex-1 px-5 pt-5 pb-36">
    <div class="mb-5">
      <h1 class="text-[22px] font-bold tracking-tight text-ink">Your notes</h1>
      <p class="mt-1 text-[12px] text-muted">Room for ideas before they become something.</p>
    </div>
    ${search("Search your thoughts")}
    <div class="mb-5 mt-3 flex flex-wrap gap-2">
      ${chip("All · 7", true)}${chip("Work · 3")}${chip("Personal · 2")}${chip("Career · 2")}
    </div>
    ${sectionHead("Keep close", "1 pinned")}
    <div class="grid grid-cols-1 gap-3 mb-7">${noteCard(noteCards[0])}</div>
    ${sectionHead("Today, 3 Nov", "2 notes")}
    <div class="grid grid-cols-1 gap-3 mb-6">${noteCard(noteCards[1])}${noteCard(noteCards[2])}</div>
    ${sectionHead("Earlier", "1 note")}
    <div class="grid grid-cols-1 gap-3 mb-6">${noteCard(noteCards[1])}</div>

    <div class="mt-10 mb-5">
      <h1 class="text-[22px] font-bold tracking-tight text-ink">Your onWards</h1>
      <p class="mt-1 text-[12px] text-muted">Wins worth remembering, made visible.</p>
    </div>
    ${search("Search onWards, skills, results")}
    <div class="mt-3 mb-5 grid grid-cols-3 gap-1 rounded-xl border border-line bg-paper p-1">
      <button type="button" class="rounded-lg py-1.5 text-[11px] font-semibold border border-line bg-cream text-ink shadow-card">Timeline</button>
      <button type="button" class="rounded-lg py-1.5 text-[11px] font-semibold text-muted">By skill</button>
      <button type="button" class="rounded-lg py-1.5 text-[11px] font-semibold text-muted">Portfolio</button>
    </div>
    ${sectionHead("Today, 3 Nov", "2 onWards")}
    <div class="grid grid-cols-1 gap-3 mb-6">${wardCard(wardCards[0])}${wardCard(wardCards[1])}</div>
    ${sectionHead("Fri, 30 Oct", "1 onWard")}
    <div class="grid grid-cols-1 gap-3 mb-6">${wardCard(wardCards[2])}</div>
    <div class="h-10" aria-hidden="true"></div>
  </main>
  ${nav}
</div>
</body>
</html>
`;

const out = path.join(__dirname, dark ? "timeline-cards-dark.html" : "timeline-cards.html");
fs.writeFileSync(out, html);
console.log(`${css} -> ${out}`);

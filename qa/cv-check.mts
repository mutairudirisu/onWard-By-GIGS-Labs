// Scratch QA for the CV exports. Builds a CvModel from fake wards, writes the PDF and
// the markdown, then asserts the PDF is structurally valid and geometrically inside
// the page. Run with: node --experimental-strip-types qa/cv-check.mts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const lib = join(here, "..", "Onward", "app", "lib");
const out = join(here, "cv-out");

// Node strips types but cannot resolve extensionless specifiers, so copy the three
// modules with their imports rewritten to explicit .mts paths.
function shim(name: string, map: Record<string, string>) {
  let src = readFileSync(join(lib, name), "utf8");
  for (const [from, to] of Object.entries(map)) src = src.split(from).join(to);
  const file = join(out, `${name.replace(/\.ts$/, "")}.mts`);
  writeFileSync(file, src);
  return file;
}

mkdirSync(out, { recursive: true });
shim("pdf.ts", {});
shim("cv.ts", {
  'from "./data"': 'from "./data.stub.mts"',
  'from "./pdf"': 'from "./pdf.mts"',
});
shim("cv-pdf.ts", { 'from "./pdf"': 'from "./pdf.mts"', 'from "./cv"': 'from "./cv.mts"' });
shim("cv-text.ts", { 'from "./cv"': 'from "./cv.mts"' });
writeFileSync(
  join(out, "data.stub.mts"),
  "export type OnWard = Record<string, any>;\nexport const DEFAULT_SETTINGS = null;\n",
);

const url = (name: string) => pathToFileURL(join(out, name)).href;

const { buildCv, EMPTY_CV_DOC } = await import(url("cv.mts"));
const { buildCvPdf, cvFileName } = await import(url("cv-pdf.mts"));
const { buildCvText, cvTextFileName } = await import(url("cv-text.mts"));

const wards = [
  {
    id: "1",
    dateLabel: "Mon 3 Nov",
    title: "Cut the checkout timeout",
    impact: "Failed payments down 12% in the first week",
    skills: ["Debugging", "TypeScript"],
    files: 0,
    inPortfolio: true,
    project: "GoDropa",
    date: "2026-11-03",
    body: "Traced a retry loop to a stale token. The fix shipped Tuesday.",
    evidence: [],
  },
  {
    id: "2",
    dateLabel: "Fri 6 Nov",
    title: "Adéọlá's onboarding rewrite",
    impact: "Setup time from 9 minutes to 3",
    skills: ["React"],
    files: 0,
    inPortfolio: true,
    project: "GoDropa",
    date: "2026-11-06",
    body: "Rebuilt the wizard as one sheet. ₦ conversion held.",
    evidence: [],
  },
  {
    id: "3",
    dateLabel: "Tue 30 Jun",
    title: "Paystack dispute queue",
    impact: "Refunds answered inside a day",
    skills: ["Payments"],
    files: 0,
    inPortfolio: true,
    project: "itxDesk",
    date: "2026-06-30",
    body: "Wrote the queue and the escalation rules.",
    evidence: [],
  },
];

const user = {
  name: "Adéọlá Ngozi",
  initials: "AN",
  role: "Frontend developer",
  location: "Lagos, Nigeria · Open to remote",
  bio: "I ship interfaces that hold up under real traffic, and I write down what changed.",
  email: "adeola@example.com",
};

const doc = {
  ...EMPTY_CV_DOC,
  headline: "Frontend developer · payments",
  links: [{ label: "Portfolio", url: "https://adeola.dev" }],
  education: [{ award: "BSc Computer Science", school: "Unilag", start: "2018-01", end: "2022-01", note: "" }],
  spans: { GoDropa: { role: "Product engineer", start: "2026-08", end: "" } },
};

const cv = buildCv({ user, onWards: wards, days: [{ day: "2026-11-03" }, { day: "2026-11-06" }], doc });

console.log(JSON.stringify(cv, null, 1));

const bytes = new Uint8Array(await buildCvPdf(cv).arrayBuffer());
writeFileSync(join(out, "cv.pdf"), bytes);

let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
}

const text = Buffer.from(bytes).toString("latin1");
check("pdf is pure ASCII", !/[^\x00-\x7F]/.test(text), `${bytes.filter((b) => b > 0x7E).length} high bytes`);
check("accented name survives as é", text.includes("\\351"));
const { ascii } = await import(url("pdf.mts"));
check("naira has no cp1252 byte, so it drops", ascii("₦1,500") === "1,500", JSON.stringify(ascii("₦1,500")));
check("middot folds to a hyphen for print", ascii("·") === "-");

// every xref offset must land on its object header
const startxref = /startxref\n(\d+)\n/.exec(text);
const offsets = [...text.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
check(
  "xref offsets point at object headers",
  offsets.every((off, i) => text.startsWith(`${i + 1} 0 obj`, off)),
  `${offsets.length} entries`,
);
check(
  "startxref lands on the xref table",
  startxref != null && text.slice(Number(startxref[1]), Number(startxref[1]) + 4) === "xref",
);

// /Length must equal the real byte span of each stream
const lengths = [...text.matchAll(/<< \/Length (\d+) >>\nstream\n/g)];
check(
  "every /Length is exact",
  lengths.length > 0 &&
    lengths.every(
      (m) => text.slice(m.index! + m[0].length + Number(m[1]), m.index! + m[0].length + Number(m[1]) + 9) === "endstream",
    ),
  `${lengths.length} streams`,
);

// geometry: nothing may sit past the bottom margin or off the right edge
const baselines = [...text.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)].map((m) => ({
  x: Number(m[1]),
  y: Number(m[2]),
}));
check(
  "text stays inside the page",
  baselines.every((b) => b.y > 38 && b.y < 842 - 24 && b.x >= 40),
  `${baselines.length} drawn lines`,
);

const md = buildCvText(cv);
writeFileSync(join(out, "cv.md"), md);
console.log("\n--- markdown ---\n" + md);
console.log("file names:", cvFileName(cv.name), cvTextFileName(cv.name));

process.exit(fail ? 1 : 0);

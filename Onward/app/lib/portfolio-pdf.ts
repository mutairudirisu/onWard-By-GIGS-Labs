import type { PortfolioModel } from "./portfolio";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 64;
const BAND_H = 158;

type Rgb = [number, number, number];
const C = {
  dark: [0.114, 0.118, 0.098] as Rgb,
  inksoft: [0.333, 0.337, 0.298] as Rgb,
  muted: [0.545, 0.549, 0.502] as Rgb,
  faint: [0.68, 0.68, 0.64] as Rgb,
  paper: [1, 1, 1] as Rgb,
  line: [0.906, 0.906, 0.871] as Rgb,
  lime: [0.788, 0.949, 0.306] as Rgb,
  limeDeep: [0.706, 0.882, 0.227] as Rgb,
  limeSoft: [0.929, 0.984, 0.776] as Rgb,
  limePale: [0.961, 0.984, 0.875] as Rgb,
  onDark: [0.76, 0.77, 0.72] as Rgb,
  onLime: [0.22, 0.26, 0.12] as Rgb,
};

function toAscii(s: string) {
  return s
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/·/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "");
}

function esc(s: string) {
  return toAscii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const DIGITS = "0123456789";

/** Helvetica advances per 1000 units - the font is not embedded, so widths come from the AFM. */
const HELVETICA: Record<string, number> = {
  a: 556, b: 611, c: 556, d: 611, e: 556, f: 278, g: 611, h: 611, i: 222, j: 222,
  k: 556, l: 222, m: 889, n: 611, o: 611, p: 611, q: 611, r: 333, s: 500, t: 278,
  u: 611, v: 556, w: 778, x: 556, y: 556, z: 500,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 278,
  K: 722, L: 611, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  " ": 278, ",": 278, ".": 278, "-": 333, ":": 278, ";": 278, "(": 333, ")": 333,
  "'": 222, '"': 355, "!": 278, "?": 556, "&": 667, "/": 278, "%": 722, "@": 975,
};
for (const d of DIGITS) HELVETICA[d] = 556;

/** Helvetica-Bold advances: a few glyphs (i, l, r, t, s, z, J) are wider than in regular. */
const HELVETICA_BOLD: Record<string, number> = {
  ...HELVETICA,
  f: 333, i: 278, j: 278, l: 278, r: 389, s: 556, t: 333, z: 556,
  J: 556, T: 611, "&": 722, ":": 333, ";": 333, "!": 333, '"': 478, "'": 238,
};

function widthOf(text: string, size: number, bold: boolean) {
  const table = bold ? HELVETICA_BOLD : HELVETICA;
  let units = 0;
  for (const ch of text) units += table[ch] ?? 611;
  return (units / 1000) * size;
}

/** Helvetica metrics are not embedded, so widths are estimated glyph by glyph. */
function measure(text: string, size: number, bold = false) {
  // 2% headroom: renderer substitution (Arial, Nimbus Sans) can run a hair wider.
  return widthOf(text, size, bold) * 1.02;
}

function wrap(text: string, maxWidth: number, size: number, bold = false): string[] {
  const words = toAscii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next, size, bold) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** One line that fits, shortened on a word boundary when it does not. */
function fit(text: string, maxWidth: number, size: number, bold = false) {
  const clean = toAscii(text);
  if (measure(clean, size, bold) <= maxWidth) return clean;
  const kept: string[] = [];
  for (const word of clean.split(/\s+/).filter(Boolean)) {
    kept.push(word);
    if (measure(`${kept.join(" ")}...`, size, bold) > maxWidth) {
      kept.pop();
      break;
    }
  }
  return kept.length ? `${kept.join(" ")}...` : "";
}

class PdfBuilder {
  private pages: string[] = [];
  private ops: string[] = [];
  y = MARGIN;

  constructor() {
    this.pages.push("");
  }

  private commit() {
    this.pages[this.pages.length - 1] = this.ops.join("");
  }

  private push(s: string) {
    this.ops.push(s);
  }

  /** Move to a fresh page when the next block would run past the bottom margin. */
  space(height: number) {
    if (this.y + height > PAGE_H - BOTTOM) {
      this.commit();
      this.ops = [];
      this.pages.push("");
      this.y = MARGIN;
    }
  }

  rect(x: number, top: number, w: number, h: number, color: Rgb, radius = 0) {
    const r = Math.min(radius, w / 2, h / 2);
    const y0 = PAGE_H - top - h;
    const y1 = PAGE_H - top;
    const k = 0.5523 * r;
    let d = `${(x + r).toFixed(2)} ${y0.toFixed(2)} m\n`;
    d += `${(x + w - r).toFixed(2)} ${y0.toFixed(2)} l\n`;
    if (r) {
      d += `${(x + w - r + k).toFixed(2)} ${y0.toFixed(2)} ${(x + w).toFixed(2)} ${(y0 + r - k).toFixed(2)} ${(x + w).toFixed(2)} ${(y0 + r).toFixed(2)} c\n`;
    }
    d += `${(x + w).toFixed(2)} ${(y1 - r).toFixed(2)} l\n`;
    if (r) {
      d += `${(x + w).toFixed(2)} ${(y1 - r + k).toFixed(2)} ${(x + w - r + k).toFixed(2)} ${y1.toFixed(2)} ${(x + w - r).toFixed(2)} ${y1.toFixed(2)} c\n`;
    }
    d += `${(x + r).toFixed(2)} ${y1.toFixed(2)} l\n`;
    if (r) {
      d += `${(x + r - k).toFixed(2)} ${y1.toFixed(2)} ${x.toFixed(2)} ${(y1 - r + k).toFixed(2)} ${x.toFixed(2)} ${(y1 - r).toFixed(2)} c\n`;
    }
    d += `${x.toFixed(2)} ${(y0 + r).toFixed(2)} l\n`;
    if (r) {
      d += `${x.toFixed(2)} ${(y0 + r - k).toFixed(2)} ${(x + r - k).toFixed(2)} ${y0.toFixed(2)} ${(x + r).toFixed(2)} ${y0.toFixed(2)} c\n`;
    }
    d += "h\n";
    this.push(`${C2(color)} rg\n${d}f\n`);
  }

  circle(cx: number, cyTop: number, r: number, color: Rgb) {
    const cy = PAGE_H - cyTop;
    const k = 0.5523 * r;
    const f = (n: number) => n.toFixed(2);
    const d =
      `${f(cx - r)} ${f(cy)} m\n` +
      `${f(cx - r)} ${f(cy + k)} ${f(cx - k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c\n` +
      `${f(cx + k)} ${f(cy + r)} ${f(cx + r)} ${f(cy + k)} ${f(cx + r)} ${f(cy)} c\n` +
      `${f(cx + r)} ${f(cy - k)} ${f(cx + k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c\n` +
      `${f(cx - k)} ${f(cy - r)} ${f(cx - r)} ${f(cy - k)} ${f(cx - r)} ${f(cy)} c\n` +
      "h\n";
    this.push(`${C2(color)} rg\n${d}f\n`);
  }

  /** Draw one line anchored on its baseline, measured from the top of the page. */
  line(
    text: string,
    x: number,
    baseline: number,
    size: number,
    opts: {
      bold?: boolean;
      color?: Rgb;
      tracking?: number;
      centerOn?: number;
      alignRight?: number;
    } = {},
  ) {
    const bold = !!opts.bold;
    const color = opts.color ?? C.dark;
    const tracking = opts.tracking ?? 0;
    const width = measure(text, size, bold) + tracking * Math.max(text.length - 1, 0);
    const at =
      opts.centerOn !== undefined
        ? opts.centerOn - width / 2
        : opts.alignRight !== undefined
          ? opts.alignRight - width
          : x;
    this.push(
      `BT ${C2(color)} rg /${bold ? "F2" : "F1"} ${size} Tf ` +
        `${tracking ? `${tracking.toFixed(2)} Tw ` : ""}1 0 0 1 ${at.toFixed(2)} ${(PAGE_H - baseline).toFixed(2)} Tm (${esc(text)}) Tj ET\n`,
    );
    if (tracking) this.push("0 Tw\n");
    return width;
  }

  paragraph(
    text: string,
    size: number,
    opts: { bold?: boolean; color?: Rgb; maxWidth?: number; leading?: number; x?: number } = {},
  ) {
    const x = opts.x ?? MARGIN;
    const leading = opts.leading ?? size * 1.42;
    const lines = wrap(text, opts.maxWidth ?? CONTENT_W - (x - MARGIN), size, opts.bold);
    for (const ln of lines) {
      this.space(leading);
      this.line(ln, x, this.y + size * 0.82, size, opts);
      this.y += leading;
    }
  }

  build(title: string): Blob {
    this.commit();
    return assemble(this.pages, title);
  }
}

function C2(c: Rgb) {
  return `${c[0]} ${c[1]} ${c[2]}`;
}

function assemble(pages: string[], title: string): Blob {
  const name = title.split(" - ")[0];
  const streams = pages.map((stream, i) => {
    const y = PAGE_H - 38;
    const left = `BT ${C2(C.faint)} rg /F1 7.5 Tf 1 0 0 1 ${MARGIN} ${y} Tm (${esc(
      `${name} - built with onWard`,
    )}) Tj ET\n`;
    const right = `BT ${C2(C.muted)} rg /F1 7.5 Tf 1 0 0 1 ${PAGE_W - MARGIN - 40} ${y} Tm (${esc(
      `${i + 1} / ${pages.length}`,
    )}) Tj ET\n`;
    return stream + left + right;
  });

  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>\nendobj\n`,
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
  ];
  streams.forEach((stream, i) => {
    const pid = 5 + i * 2;
    const cid = 6 + i * 2;
    objects.push(
      `${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>\nendobj\n`,
      `${cid} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`,
    );
  });
  const info = objects.length + 1;
  objects.push(
    `${info} 0 obj\n<< /Title (${esc(title)}) /Producer (onWard) /Creator (onWard) >>\nendobj\n`,
  );

  const header = "%PDF-1.4\n";
  let body = "";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(header.length + body.length);
    body += obj;
  }
  const xrefStart = header.length + body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${info} 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;
  return new Blob([header + body + xref + trailer], { type: "application/pdf" });
}

function sectionHead(doc: PdfBuilder, label: string) {
  doc.space(34);
  doc.rect(MARGIN, doc.y + 1, 4, 12, C.limeDeep);
  doc.line(label.toUpperCase(), MARGIN + 12, doc.y + 11, 9.5, { bold: true, tracking: 1.1 });
  doc.y += 26;
}

function drawHeader(doc: PdfBuilder, p: PortfolioModel) {
  doc.rect(0, 0, PAGE_W, BAND_H, C.dark);
  doc.rect(0, BAND_H, PAGE_W, 5, C.lime);

  doc.line("ONWARD - WORK PORTFOLIO", MARGIN, 44, 8.5, {
    bold: true,
    color: C.lime,
    tracking: 1.6,
  });
  let nameSize = 24;
  while (nameSize > 15 && measure(p.name, nameSize, true) > CONTENT_W - 90) nameSize -= 2;
  doc.line(fit(p.name, CONTENT_W - 90, nameSize, true), MARGIN, 78, nameSize, {
    bold: true,
    color: C.paper,
  });
  const contact = [p.role, p.location].filter(Boolean).join("  -  ");
  doc.line(fit(contact || p.email, CONTENT_W - 90, 10.5), MARGIN, 100, 10.5, { color: C.onDark });

  if (p.bio) {
    wrap(p.bio, CONTENT_W - 90, 10)
      .slice(0, 3)
      .forEach((ln, i) => doc.line(ln, MARGIN, 122 + i * 13, 10, { color: C.onDark }));
  }

  doc.circle(PAGE_W - MARGIN - 28, 68, 28, C.lime);
  doc.line(p.initials, 0, 73, 15, { bold: true, color: C.dark, centerOn: PAGE_W - MARGIN - 28 });

  doc.y = BAND_H + 30;
}

function drawStats(doc: PdfBuilder, p: PortfolioModel) {
  const cols = 3;
  const gap = 10;
  const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
  const cellH = 46;
  const rows = Math.ceil(p.stats.length / cols);
  const blockH = rows * (cellH + gap) + 6;
  doc.space(26 + blockH);
  sectionHead(doc, "Proof at a glance");
  doc.space(blockH);
  p.stats.forEach((stat, i) => {
    const x = MARGIN + (i % cols) * (cellW + gap);
    const top = doc.y + Math.floor(i / cols) * (cellH + gap);
    doc.rect(x, top, cellW, cellH, C.limePale, 8);
    doc.line(stat.value, 0, top + 24, 15, { bold: true, centerOn: x + cellW / 2 });
    doc.line(stat.label.toUpperCase(), 0, top + 38, 6.8, {
      bold: true,
      color: C.muted,
      tracking: 0.7,
      centerOn: x + cellW / 2,
    });
  });
  doc.y += rows * (cellH + gap) + 6;
}

function drawHighlights(doc: PdfBuilder, p: PortfolioModel) {
  const picks = p.headline.filter((w) => w.impact).slice(0, 2);
  if (!picks.length) return;
  doc.space(70);
  const gap = 10;
  const cardW = (CONTENT_W - gap) / 2;
  const cardH = 58;
  picks.forEach((win, i) => {
    const x = MARGIN + i * (cardW + gap);
    doc.rect(x, doc.y, cardW, cardH, C.lime, 10);
    wrap(win.impact, cardW - 24, 10.5, true)
      .slice(0, 2)
      .forEach((ln, j) =>
        doc.line(ln, x + 12, doc.y + 18 + j * 12, 10.5, { bold: true, color: C.dark }),
      );
    const sub = fit(win.title, cardW - 24, 7.5);
    if (sub) doc.line(sub, x + 12, doc.y + cardH - 8, 7.5, { color: C.onLime });
  });
  doc.y += cardH + 10;
}

function drawWins(doc: PdfBuilder, p: PortfolioModel) {
  sectionHead(doc, "Small steps. Tangible impact.");
  if (!p.wins.length) {
    doc.paragraph("No portfolio entries logged yet.", 10, { color: C.muted });
    return;
  }
  for (const win of p.wins) {
    doc.space(64);
    doc.line(win.meta.toUpperCase(), MARGIN, doc.y + 8, 7.2, {
      bold: true,
      color: C.muted,
      tracking: 0.9,
    });
    doc.y += 15;
    doc.paragraph(win.title, 12.5, { bold: true, leading: 16 });
    doc.y += 3;
    if (win.impact) {
      doc.space(24);
      const chipW = measure(win.impact, 9.5, true) + 18;
      if (chipW <= CONTENT_W) {
        doc.rect(MARGIN, doc.y, chipW, 17, C.limeSoft, 5);
        doc.line(win.impact, MARGIN + 9, doc.y + 12, 9.5, { bold: true });
      } else {
        doc.paragraph(win.impact, 9.5, { bold: true });
      }
      doc.y += 24;
    }
    if (win.body) doc.paragraph(win.body, 10, { color: C.inksoft, maxWidth: CONTENT_W });
    const foot = [
      win.skills.length ? `Skills: ${win.skills.join(", ")}` : "",
      win.evidence ? `${win.evidence} evidence item${win.evidence === 1 ? "" : "s"}` : "",
    ]
      .filter(Boolean)
      .join("   -   ");
    doc.space(24);
    if (foot) doc.line(fit(foot, CONTENT_W, 8.8), MARGIN, doc.y + 10, 8.8, { color: C.muted });
    doc.y += 24;
  }
}

function drawSkills(doc: PdfBuilder, p: PortfolioModel) {
  if (p.skills.length) doc.space(26 + 21 * 2);
  sectionHead(doc, "Skills. Shown by the work.");
  if (!p.skills.length) {
    doc.paragraph("Skills build up as you tag them on your onWards.", 10, { color: C.muted });
    return;
  }
  const labelW = 186;
  const rightW = 92;
  const trackW = CONTENT_W - labelW - rightW;
  for (const skill of p.skills) {
    doc.space(22);
    doc.line(fit(skill.name, labelW - 10, 10, true), MARGIN, doc.y + 12, 10, { bold: true });
    const top = doc.y + 4;
    doc.rect(MARGIN + labelW, top, trackW, 7, C.line, 3.5);
    doc.rect(
      MARGIN + labelW,
      top,
      Math.max(7, (trackW * skill.percent) / 100),
      7,
      C.limeDeep,
      3.5,
    );
    doc.line(`${skill.stage} - ${skill.count} win${skill.count === 1 ? "" : "s"}`, 0, doc.y + 11, 8, {
      color: C.muted,
      alignRight: PAGE_W - MARGIN,
    });
    doc.y += 21;
  }
  doc.space(18);
  doc.line(
    "Skills assessments are coming soon. Verified results will appear here.",
    MARGIN,
    doc.y + 10,
    8.5,
    { color: C.faint },
  );
  doc.y += 22;
}

function drawClosing(doc: PdfBuilder, p: PortfolioModel) {
  doc.space(70);
  sectionHead(doc, "Let's talk about what's next.");
  if (p.email) doc.line(fit(p.email, CONTENT_W, 11, true), MARGIN, doc.y + 11, 11, { bold: true });
  doc.y += 20;
  doc.paragraph(
    "Metrics are self-reported from the work logged in onWard. Evidence shared with permission.",
    8.5,
    { color: C.faint },
  );
}

export function buildPortfolioPdf(p: PortfolioModel): Blob {
  const doc = new PdfBuilder();
  drawHeader(doc, p);
  drawStats(doc, p);
  drawHighlights(doc, p);
  drawWins(doc, p);
  drawSkills(doc, p);
  drawClosing(doc, p);
  return doc.build(`${p.name} - onWard portfolio`);
}

export function portfolioFileName(name: string) {
  return `onWard-${
    toAscii(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "portfolio"
  }.pdf`;
}

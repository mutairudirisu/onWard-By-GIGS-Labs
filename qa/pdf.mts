/**
 * The PDF engine behind every onWard export.
 *
 * A hand-rolled PDF 1.4 byte writer: base-14 Helvetica with WinAnsiEncoding, no
 * dependencies, no font files. Kept separate from the documents that use it so a
 * CV and a portfolio share one set of page-break and text metrics.
 */

export const PAGE_W = 595;
export const PAGE_H = 842;
export const MARGIN = 48;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const BOTTOM = 64;

export type Rgb = [number, number, number];

export const C = {
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

/**
 * cp1252 punctuation that sits outside the Latin-1 block. Helvetica can draw all of
 * these once they reach the content stream as a single byte.
 */
const CP1252: Record<string, number> = {
  "\u20AC": 0x80,
  "\u201A": 0x82,
  "\u0192": 0x83,
  "\u201E": 0x84,
  "\u2020": 0x86,
  "\u2021": 0x87,
  "\u02C6": 0x88,
  "\u2030": 0x89,
  "\u0160": 0x8a,
  "\u2039": 0x8b,
  "\u0152": 0x8c,
  "\u017D": 0x8e,
  "\u2018": 0x91,
  "\u2019": 0x92,
  "\u201C": 0x93,
  "\u201D": 0x94,
  "\u2022": 0x95,
  "\u02DC": 0x98,
  "\u2122": 0x99,
  "\u0161": 0x9a,
  "\u203A": 0x9b,
  "\u0153": 0x9c,
  "\u017E": 0x9e,
  "\u0178": 0x9f,
};

function cp1252Code(ch: string): number | null {
  const cp = ch.charCodeAt(0);
  if (cp >= 0xa0 && cp <= 0xff) return cp;
  return CP1252[ch] ?? null;
}

/**
 * Fold to what the declared encoding can actually render: typographic punctuation to
 * its ASCII shape, accented Latin letters kept, everything else dropped.
 * `₦` (U+20A6) is not in WinAnsi and will not survive - it stays on screen, not in print.
 */
export function ascii(s: string) {
  const folded = s
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/·/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");
  let out = "";
  for (const ch of folded) {
    if (ch >= " " && ch <= "~") {
      out += ch;
      continue;
    }
    const code = cp1252Code(ch);
    if (code) {
      out += String.fromCharCode(code);
      continue;
    }
    // Nothing in this encoding for it: keep the letter and lose the mark, so "Adéọlá"
    // prints as Adéola rather than silently losing the ọ altogether.
    const base = baseGlyph(ch);
    if (base >= " " && base <= "~") out += base;
  }
  return out;
}

/** Accents folded away too - for slugs and filenames, where bytes must stay plain ASCII. */
export function asciiFold(s: string) {
  return ascii(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
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
  "æ": 889, "Æ": 889, "œ": 889, "Œ": 889, "ß": 611,
};
for (const d of DIGITS) HELVETICA[d] = 556;

/** Helvetica-Bold advances: a few glyphs (i, l, r, t, s, z, J) are wider than in regular. */
const HELVETICA_BOLD: Record<string, number> = {
  ...HELVETICA,
  f: 333, i: 278, j: 278, l: 278, r: 389, s: 556, t: 333, z: 556,
  J: 556, T: 611, "&": 722, ":": 333, ";": 333, "!": 333, '"': 478, "'": 238,
};

/** An accented letter takes its base letter's advance: é = e, Á = A. */
function baseGlyph(ch: string) {
  const d = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return d.length === 1 ? d : ch;
}

function widthOf(text: string, size: number, bold: boolean) {
  const table = bold ? HELVETICA_BOLD : HELVETICA;
  let units = 0;
  for (const ch of text) units += table[ch] ?? table[baseGlyph(ch)] ?? 611;
  return (units / 1000) * size;
}

/** Helvetica metrics are not embedded, so widths are estimated glyph by glyph. */
export function measure(text: string, size: number, bold = false) {
  // 2% headroom: renderer substitution (Arial, Nimbus Sans) can run a hair wider.
  return widthOf(text, size, bold) * 1.02;
}

export function wrap(text: string, maxWidth: number, size: number, bold = false): string[] {
  const words = ascii(text).split(/\s+/).filter(Boolean);
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
export function fit(text: string, maxWidth: number, size: number, bold = false) {
  const clean = ascii(text);
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

/**
 * Escape for a PDF literal string. Anything above 0x7E leaves as an octal byte so the
 * stream stays pure ASCII - which is also what makes /Length below hold true.
 */
export function esc(s: string) {
  return ascii(s)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\x80-\xFF]/g, (ch) => `\\${ch.charCodeAt(0).toString(8).padStart(3, "0")}`);
}

function C2(c: Rgb) {
  return `${c[0]} ${c[1]} ${c[2]}`;
}

export class PdfBuilder {
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

  /** Dot and a hanging line per item - the list primitive a CV needs. */
  bullets(
    items: string[],
    opts: { size?: number; color?: Rgb; x?: number; gap?: number; maxWidth?: number } = {},
  ) {
    const size = opts.size ?? 10;
    const textX = (opts.x ?? MARGIN) + 12;
    const leading = size * 1.42;
    for (const item of items) {
      const lines = wrap(item, opts.maxWidth ?? CONTENT_W - (textX - MARGIN), size);
      lines.forEach((ln, i) => {
        this.space(leading);
        if (i === 0) this.circle((opts.x ?? MARGIN) + 2, this.y + size * 0.45, 1.5, C.limeDeep);
        this.line(ln, textX, this.y + size * 0.82, size, { color: opts.color, bold: false });
        this.y += leading;
      });
      this.y += opts.gap ?? 0;
    }
  }

  build(title: string): Blob {
    this.commit();
    return assemble(this.pages, title);
  }
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

/** Lime tick + uppercase tracked label. Costs 26px of the cursor. */
export function sectionHead(doc: PdfBuilder, label: string) {
  doc.space(34);
  doc.rect(MARGIN, doc.y + 1, 4, 12, C.limeDeep);
  doc.line(label.toUpperCase(), MARGIN + 12, doc.y + 11, 9.5, { bold: true, tracking: 1.1 });
  doc.y += 26;
}

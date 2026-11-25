import {
  C,
  CONTENT_W,
  MARGIN,
  PAGE_W,
  PdfBuilder,
  asciiFold,
  fit,
  measure,
  sectionHead,
  wrap,
} from "./pdf";
import type { PortfolioModel } from "./portfolio";

const BAND_H = 158;
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
    "Metrics are self-reported from the work logged in onWard.",
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
    asciiFold(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "portfolio"
  }.pdf`;
}

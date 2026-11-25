import {
  C,
  CONTENT_W,
  MARGIN,
  PAGE_W,
  type Rgb,
  PdfBuilder,
  fit,
  measure,
} from "./pdf";
import {
  cvSlug,
  monthYear,
  type CvExperience,
  type CvModel,
  type CvTemplateId,
} from "./cv";

const roleLine = (e: CvExperience) => [e.role, e.project].filter(Boolean).join(" - ");

const THEMES: Record<CvTemplateId, { accent: Rgb; header: Rgb | null }> = {
  classic: { accent: [0.435, 0.592, 0.157], header: null },
  modern: { accent: [0.129, 0.443, 0.545], header: null },
  executive: { accent: [0.216, 0.341, 0.514], header: [0.09, 0.169, 0.275] },
  elegant: { accent: [0.541, 0.345, 0.471], header: null },
};

function themedSectionHead(doc: PdfBuilder, label: string, accent: Rgb) {
  doc.space(34);
  doc.rect(MARGIN, doc.y + 1, 4, 12, accent);
  doc.line(label.toUpperCase(), MARGIN + 12, doc.y + 11, 9.5, {
    bold: true,
    tracking: 1.1,
    color: accent,
  });
  doc.y += 26;
}

/**
 * A4 pages of plain text: no columns, no sidebars - applicant tracking systems read
 * linear documents best, and nothing here is invented beyond what cv.ts already derived.
 */
function drawName(doc: PdfBuilder, cv: CvModel, template: CvTemplateId) {
  const theme = THEMES[template];
  const x = theme.header ? MARGIN + 16 : MARGIN;
  const width = theme.header ? CONTENT_W - 32 : CONTENT_W - 20;
  const textColor = theme.header ? C.paper : C.dark;
  if (theme.header) {
    doc.rect(MARGIN, doc.y, CONTENT_W, 108, theme.header, 8);
    doc.y += 20;
  }
  let size = 22;
  while (size > 15 && measure(cv.name, size, true) > width) size -= 2;
  doc.line(fit(cv.name, width, size, true), x, doc.y + size * 0.85, size, {
    bold: true,
    color: textColor,
  });
  doc.y += size + 4;

  if (cv.headline) {
    doc.paragraph(cv.headline, 11, { color: theme.header ? C.onDark : C.inksoft, x });
    doc.y += 1;
  }

  const contact = [
    cv.email,
    cv.phone,
    cv.location,
    ...cv.links.map((l) => (l.label.trim() ? `${l.label.trim()}: ${l.url.trim()}` : l.url.trim())),
  ]
    .filter(Boolean)
    .join("   -   ");
  if (contact) {
    doc.paragraph(contact, 9.5, { color: theme.header ? C.onDark : C.muted, x });
    doc.y += 2;
  }

  if (theme.header) doc.y += 12;
  doc.rect(MARGIN, doc.y, CONTENT_W, 1.2, theme.accent);
  doc.y += 14;
}

function drawSummary(doc: PdfBuilder, cv: CvModel, accent: Rgb) {
  if (!cv.summary) return;
  themedSectionHead(doc, "Profile", accent);
  doc.paragraph(cv.summary, 10, { color: C.inksoft });
}

function drawExperience(doc: PdfBuilder, cv: CvModel, accent: Rgb) {
  themedSectionHead(doc, "Experience", accent);
  if (!cv.experience.length) {
    doc.paragraph(
      "Add work experience or pin onWards to your portfolio to include it here.",
      10,
      { color: C.muted },
    );
    return;
  }
  if (cv.experience.some((e) => e.asLogged)) {
    doc.paragraph("Dates follow the days the work was logged, unless you edited them.", 8.5, {
      color: C.faint,
    });
    doc.y += 3;
  }

  for (const entry of cv.experience) {
    doc.space(40);
    const size = 11.5;
    const periodW = entry.period ? measure(entry.period, 9) + 12 : 0;
    doc.space(size * 1.42);
    const baseline = doc.y + size * 0.82;
    doc.line(fit(roleLine(entry), CONTENT_W - periodW, size, true), MARGIN, baseline, size, {
      bold: true,
    });
    if (entry.period) {
      doc.line(entry.period, 0, baseline, 9, { color: C.muted, alignRight: PAGE_W - MARGIN });
    }
    doc.y += size * 1.42;
    if (entry.location) {
      doc.paragraph(entry.location, 8.8, { color: C.muted });
      doc.y += 1;
    }

    doc.bullets(entry.bullets, { size: 10, gap: 1, markerColor: accent });
    if (entry.skills.length) {
      doc.y += 1;
      doc.line(fit(`Skills: ${entry.skills.join(", ")}`, CONTENT_W, 8.8), MARGIN + 12, doc.y + 8, 8.8, {
        color: C.muted,
      });
    }
    doc.y += 16;
  }
}

function drawSkills(doc: PdfBuilder, cv: CvModel, accent: Rgb) {
  if (!cv.skills.length) return;
  themedSectionHead(doc, "Digital Skills and Skills", accent);
  doc.paragraph(
    cv.skills.map((s) => s.name).join(", "),
    10,
    { color: C.inksoft },
  );
}

function drawCertifications(doc: PdfBuilder, cv: CvModel, accent: Rgb) {
  if (!cv.certifications.length) return;
  themedSectionHead(doc, "Training and Certifications", accent);
  for (const item of cv.certifications) {
    doc.space(36);
    const meta = [item.issuer, item.date].filter(Boolean).join(" - ");
    const titleSize = 10.5;
    doc.paragraph(item.title, titleSize, { bold: true, color: C.dark });
    if (meta) doc.paragraph(meta, 9, { color: C.muted });
    if (item.note) doc.paragraph(item.note, 9.5, { color: C.inksoft });
    doc.y += 5;
  }
}

function drawEducation(doc: PdfBuilder, cv: CvModel, accent: Rgb) {
  if (!cv.education.length) return;
  themedSectionHead(doc, "Education", accent);
  for (const edu of cv.education) {
    doc.space(34);
    const period = edu.start
      ? `${monthYear(edu.start)} - ${edu.end ? monthYear(edu.end) : "Present"}`
      : edu.end
        ? monthYear(edu.end)
        : "";
    const size = 11;
    const periodW = period ? measure(period, 9) + 12 : 0;
    doc.space(size * 1.42);
    const baseline = doc.y + size * 0.82;
    doc.line(
      fit([edu.award, edu.school].filter(Boolean).join(" - "), CONTENT_W - periodW, size, true),
      MARGIN,
      baseline,
      size,
      { bold: true },
    );
    if (period) doc.line(period, 0, baseline, 9, { color: C.muted, alignRight: PAGE_W - MARGIN });
    doc.y += size * 1.42;
    if (edu.note.trim()) doc.paragraph(edu.note.trim(), 9.5, { color: C.inksoft });
    doc.y += 8;
  }
}

export function buildCvPdf(cv: CvModel, template: CvTemplateId = "classic"): Blob {
  const doc = new PdfBuilder();
  const { accent } = THEMES[template];
  drawName(doc, cv, template);
  drawSummary(doc, cv, accent);
  drawExperience(doc, cv, accent);
  drawSkills(doc, cv, accent);
  drawCertifications(doc, cv, accent);
  drawEducation(doc, cv, accent);

  doc.space(40);
  doc.line(
    `Built with onWard from ${cv.stats[0]?.value ?? 0} logged onWards. Metrics are self-reported.`,
    MARGIN,
    doc.y + 9,
    8.5,
    { color: C.faint },
  );
  return doc.build(`${cv.name} - onWard CV`);
}

export function cvFileName(name: string) {
  return `cv-${cvSlug(name)}.pdf`;
}

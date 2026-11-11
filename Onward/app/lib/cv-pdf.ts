import {
  C,
  CONTENT_W,
  MARGIN,
  PAGE_W,
  PdfBuilder,
  fit,
  measure,
  sectionHead,
} from "./pdf";
import { cvSlug, monthYear, type CvExperience, type CvModel } from "./cv";

const roleLine = (e: CvExperience) => [e.role, e.project].filter(Boolean).join(" - ");

/**
 * A4 pages of plain text: no columns, no sidebars - applicant tracking systems read
 * linear documents best, and nothing here is invented beyond what cv.ts already derived.
 */
function drawName(doc: PdfBuilder, cv: CvModel) {
  let size = 22;
  while (size > 15 && measure(cv.name, size, true) > CONTENT_W - 20) size -= 2;
  doc.line(fit(cv.name, CONTENT_W - 20, size, true), MARGIN, doc.y + size * 0.85, size, {
    bold: true,
  });
  doc.y += size + 4;

  if (cv.headline) {
    doc.paragraph(cv.headline, 11, { color: C.inksoft });
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
    doc.paragraph(contact, 9.5, { color: C.muted });
    doc.y += 2;
  }

  doc.rect(MARGIN, doc.y, CONTENT_W, 1.2, C.limeDeep);
  doc.y += 14;
}

function drawSummary(doc: PdfBuilder, cv: CvModel) {
  if (!cv.summary) return;
  sectionHead(doc, "Profile");
  doc.paragraph(cv.summary, 10, { color: C.inksoft });
}

function drawExperience(doc: PdfBuilder, cv: CvModel) {
  sectionHead(doc, "Experience");
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

    doc.bullets(entry.bullets, { size: 10, gap: 1 });
    if (entry.skills.length) {
      doc.y += 1;
      doc.line(fit(`Skills: ${entry.skills.join(", ")}`, CONTENT_W, 8.8), MARGIN + 12, doc.y + 8, 8.8, {
        color: C.muted,
      });
    }
    doc.y += 16;
  }
}

function drawSkills(doc: PdfBuilder, cv: CvModel) {
  if (!cv.skills.length) return;
  sectionHead(doc, "Digital Skills and Skills");
  doc.paragraph(
    cv.skills.map((s) => s.name).join(", "),
    10,
    { color: C.inksoft },
  );
}

function drawCertifications(doc: PdfBuilder, cv: CvModel) {
  if (!cv.certifications.length) return;
  sectionHead(doc, "Training and Certifications");
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

function drawEducation(doc: PdfBuilder, cv: CvModel) {
  if (!cv.education.length) return;
  sectionHead(doc, "Education");
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

export function buildCvPdf(cv: CvModel): Blob {
  const doc = new PdfBuilder();
  drawName(doc, cv);
  drawSummary(doc, cv);
  drawExperience(doc, cv);
  drawSkills(doc, cv);
  drawCertifications(doc, cv);
  drawEducation(doc, cv);

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

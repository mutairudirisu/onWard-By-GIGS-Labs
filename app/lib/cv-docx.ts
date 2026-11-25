import { cvSlug, monthYear, type CvModel, type CvTemplateId } from "./cv";

type ZipEntry = { name: string; data: Uint8Array };

const encoder = new TextEncoder();
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < CRC_TABLE.length; n++) {
  let value = n;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[n] = value >>> 0;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const localHeader = new Uint8Array(30 + name.length);
    const local = new DataView(localHeader.buffer);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint32(14, checksum, true);
    local.setUint32(18, entry.data.length, true);
    local.setUint32(22, entry.data.length, true);
    local.setUint16(26, name.length, true);
    localHeader.set(name, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + name.length);
    const central = new DataView(centralHeader.buffer);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint32(16, checksum, true);
    central.setUint32(20, entry.data.length, true);
    central.setUint32(24, entry.data.length, true);
    central.setUint16(28, name.length, true);
    central.setUint32(42, localOffset, true);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + entry.data.length;
  }

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);

  const parts = [...localParts, ...centralParts, end];
  const output = new ArrayBuffer(parts.reduce((size, part) => size + part.length, 0));
  const bytes = new Uint8Array(output);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  return new Blob([output], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function xml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraph(
  value: string,
  options: {
    bold?: boolean;
    color?: string;
    size?: number;
    align?: "left" | "center" | "right";
    before?: number;
    after?: number;
    left?: number;
    hanging?: number;
    shading?: string;
    borderBottom?: string;
    font?: string;
  } = {},
) {
  const pPr: string[] = [];
  if (options.align) pPr.push(`<w:jc w:val="${options.align}"/>`);
  if (options.before || options.after) {
    pPr.push(
      `<w:spacing w:before="${options.before ?? 0}" w:after="${options.after ?? 100}"/>`,
    );
  }
  if (options.left || options.hanging) {
    pPr.push(
      `<w:ind w:left="${options.left ?? 0}" w:hanging="${options.hanging ?? 0}"/>`,
    );
  }
  if (options.shading) pPr.push(`<w:shd w:fill="${options.shading}"/>`);
  if (options.borderBottom) {
    pPr.push(
      `<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${options.borderBottom}"/></w:pBdr>`,
    );
  }
  const rPr = [
    options.bold ? "<w:b/>" : "",
    options.color ? `<w:color w:val="${options.color}"/>` : "",
    options.size ? `<w:sz w:val="${options.size}"/>` : "",
    options.font ? `<w:rFonts w:ascii="${options.font}" w:hAnsi="${options.font}"/>` : "",
  ].join("");
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : ""}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${xml(value)}</w:t></w:r></w:p>`;
}

const PALETTE: Record<CvTemplateId, { accent: string; banner?: string; font: string }> = {
  classic: { accent: "789B2C", font: "Aptos" },
  modern: { accent: "21718B", font: "Aptos" },
  executive: { accent: "375783", banner: "172B46", font: "Aptos" },
  elegant: { accent: "8A5878", font: "Georgia" },
};

function documentXml(cv: CvModel, template: CvTemplateId) {
  const colors = PALETTE[template];
  const header = (text: string, size: number, bold: boolean, after: number) =>
    paragraph(text, {
      bold,
      size,
      color: colors.banner ? "FFFFFF" : "1D1E19",
      shading: colors.banner,
      after,
      font: colors.font,
    });
  const section = (name: string) =>
    paragraph(name.toUpperCase(), {
      bold: true,
      size: 20,
      color: colors.accent,
      before: 240,
      after: 120,
      borderBottom: colors.accent,
      font: colors.font,
    });

  const content: string[] = [
    header(cv.name || "Your name", 36, true, 80),
  ];
  if (cv.headline) content.push(header(cv.headline, 22, true, 80));
  const contacts = [
    cv.email,
    cv.phone,
    cv.location,
    ...cv.links.map((link) => (link.label ? `${link.label}: ${link.url}` : link.url)),
  ].filter(Boolean);
  if (contacts.length) {
    content.push(
      paragraph(contacts.join("  |  "), {
        size: 18,
        color: colors.banner ? "E4EAF1" : "66685F",
        shading: colors.banner,
        after: 220,
        font: colors.font,
      }),
    );
  }

  if (cv.summary) {
    content.push(section("Profile"));
    content.push(paragraph(cv.summary, { size: 20, after: 100, font: colors.font }));
  }

  content.push(section("Experience"));
  if (!cv.experience.length) {
    content.push(
      paragraph("Add work experience or select onWards to include it here.", {
        size: 20,
        color: "77796F",
        font: colors.font,
      }),
    );
  }
  for (const entry of cv.experience) {
    const title = [entry.role, entry.project].filter(Boolean).join(" - ") || "Role";
    content.push(
      paragraph(`${title}${entry.period ? `  |  ${entry.period}` : ""}`, {
        bold: true,
        size: 21,
        color: "1D1E19",
        before: 120,
        after: 50,
        font: colors.font,
      }),
    );
    if (entry.location) {
      content.push(paragraph(entry.location, { size: 18, color: "66685F", after: 50, font: colors.font }));
    }
    for (const line of entry.bullets) {
      content.push(
        paragraph(`•  ${line}`, {
          size: 19,
          color: "33352F",
          left: 260,
          hanging: 180,
          after: 40,
          font: colors.font,
        }),
      );
    }
    if (entry.skills.length) {
      content.push(
        paragraph(`Skills: ${entry.skills.join(", ")}`, {
          size: 18,
          color: "66685F",
          after: 90,
          font: colors.font,
        }),
      );
    }
  }

  if (cv.skills.length) {
    content.push(section("Digital Skills and Skills"));
    content.push(paragraph(cv.skills.map((skill) => skill.name).join("  ·  "), { size: 20, font: colors.font }));
  }

  if (cv.certifications.length) {
    content.push(section("Training and Certifications"));
    for (const item of cv.certifications) {
      const meta = [item.issuer, item.date].filter(Boolean).join("  |  ");
      content.push(paragraph(item.title, { bold: true, size: 20, after: 40, font: colors.font }));
      if (meta) content.push(paragraph(meta, { size: 18, color: "66685F", after: 40, font: colors.font }));
      if (item.note) content.push(paragraph(item.note, { size: 19, after: 100, font: colors.font }));
    }
  }

  if (cv.education.length) {
    content.push(section("Education"));
    for (const item of cv.education) {
      const period = item.start
        ? `${monthYear(item.start)} - ${item.end ? monthYear(item.end) : "Present"}`
        : item.end
          ? monthYear(item.end)
          : "";
      content.push(
        paragraph(
          `${[item.award, item.school].filter(Boolean).join(" - ")}${period ? `  |  ${period}` : ""}`,
          { bold: true, size: 20, after: 50, font: colors.font },
        ),
      );
      if (item.note) content.push(paragraph(item.note, { size: 19, after: 100, font: colors.font }));
    }
  }

  content.push(
    paragraph(
      `Built with onWard from ${cv.stats[0]?.value ?? 0} logged onWards. Metrics are self-reported.`,
      { size: 16, color: "999A91", before: 300, font: colors.font },
    ),
  );
  content.push(
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900" w:header="450" w:footer="450" w:gutter="0"/></w:sectPr>',
  );
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${content.join("")}</w:body></w:document>`;
}

export function buildCvDocx(cv: CvModel, template: CvTemplateId = "classic") {
  return zip([
    {
      name: "[Content_Types].xml",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
    },
    {
      name: "_rels/.rels",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
    },
    { name: "word/document.xml", data: encoder.encode(documentXml(cv, template)) },
  ]);
}

export function cvDocxFileName(name: string) {
  return `cv-${cvSlug(name)}.docx`;
}

"use client";

import { Button } from "@/components/ui";
import { useCurrentUser, type CurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";
import {
  appraisal,
  portfolioWins,
  skillTests,
  streak,
  type OnWard,
} from "@/lib/data";
import { Download } from "lucide-react";

type Line = { text: string; size: number; bold?: boolean; gapBefore?: number };

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

function buildPdf(lines: Line[]): Blob {
  const pageW = 595;
  const pageH = 842;
  const marginX = 56;
  const top = pageH - 72;
  const bottom = 60;

  const pages: Line[][] = [];
  let cur: Line[] = [];
  let y = top;
  for (const ln of lines) {
    const lh = ln.size * 1.45 + (ln.gapBefore ?? 0);
    if (y - lh < bottom) {
      pages.push(cur);
      cur = [];
      y = top;
    }
    cur.push(ln);
    y -= lh;
  }
  if (cur.length) pages.push(cur);

  const streams = pages.map((pg) => {
    let yy = top;
    let s = "";
    for (const ln of pg) {
      yy -= ln.gapBefore ?? 0;
      const font = ln.bold ? "/F2" : "/F1";
      s += `BT ${font} ${ln.size} Tf 1 0 0 1 ${marginX} ${yy.toFixed(2)} Tm (${esc(ln.text)}) Tj ET\n`;
      yy -= ln.size * 1.45;
    }
    return s;
  });

  const objects: Record<number, string> = {};
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects[2] = `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>\nendobj\n`;
  objects[3] = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  objects[4] =
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  pages.forEach((_, i) => {
    const pid = 5 + i * 2;
    const cid = 6 + i * 2;
    objects[pid] = `${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>\nendobj\n`;
    const stream = streams[i];
    objects[cid] = `${cid} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;
  });

  const header = "%PDF-1.4\n";
  const total = 4 + pages.length * 2;
  let body = "";
  const offsets: number[] = [];
  for (let id = 1; id <= total; id++) {
    offsets[id] = header.length + body.length;
    body += objects[id];
  }
  const xrefStart = header.length + body.length;
  let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= total; id++) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new Blob([header + body + xref + trailer], { type: "application/pdf" });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function wrap(text: string, width: number): string[] {
  const words = toAscii(text).split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      if (line) out.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function portfolioLines(user: CurrentUser, onWards: OnWard[]): Line[] {
  const L: Line[] = [];
  L.push({ text: "onWard - Work portfolio", size: 11, bold: true });
  L.push({ text: user.name, size: 24, bold: true, gapBefore: 8 });
  L.push({ text: user.role, size: 12 });
  L.push({ text: `${user.location}`, size: 10 });
  L.push({ text: user.email, size: 10 });
  for (const t of wrap(user.bio, 92)) L.push({ text: t, size: 11, gapBefore: 8 });

  L.push({
    text: `Appraisal snapshot - ${appraisal.period}`,
    size: 16,
    bold: true,
    gapBefore: 20,
  });
  L.push({
    text: `${appraisal.assigned.done} of ${appraisal.assigned.total} assigned tasks completed - ${appraisal.assigned.onTime} on time`,
    size: 11,
  });
  L.push({
    text: `Current streak ${streak.current} days - ${streak.daysUsing} days using onWard`,
    size: 11,
  });
  for (const o of appraisal.outcomes) {
    for (const t of wrap("- " + o, 92)) L.push({ text: t, size: 11, gapBefore: 4 });
  }

  L.push({ text: "Selected achievements", size: 16, bold: true, gapBefore: 22 });
  for (const win of portfolioWins) {
    L.push({ text: win.meta, size: 9, gapBefore: 10 });
    L.push({ text: win.title, size: 13, bold: true });
    L.push({ text: win.highlight, size: 11, bold: true });
    for (const t of wrap(win.body, 92)) L.push({ text: t, size: 10.5 });
    L.push({ text: `Skills: ${win.skills.join(", ")}`, size: 10 });
  }

  L.push({ text: "Digital skills test results", size: 16, bold: true, gapBefore: 22 });
  for (const test of skillTests) {
    L.push({ text: `${test.name} - ${test.score}`, size: 11, bold: true, gapBefore: 8 });
    L.push({ text: test.meta, size: 10 });
  }

  L.push({ text: "Recent onWards", size: 16, bold: true, gapBefore: 22 });
  if (onWards.length === 0) L.push({ text: "No onWards logged yet.", size: 11, gapBefore: 8 });
  for (const ow of onWards) {
    L.push({ text: `${ow.dateLabel} - ${ow.title}`, size: 11, bold: true, gapBefore: 8 });
    L.push({ text: ow.impact, size: 10 });
    L.push({ text: `Skills: ${ow.skills.join(", ")}`, size: 10 });
  }

  L.push({
    text: "Assessments verified where noted. Other metrics are self-reported. Built with onWard.",
    size: 9,
    gapBefore: 26,
  });
  return L;
}

export function PortfolioDownloadButton({
  label = "Download portfolio PDF",
  variant = "secondary",
  className,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "quiet" | "dark";
  className?: string;
}) {
  const user = useCurrentUser();
  const { onWards } = useStore();

  return (
    <Button
      variant={variant}
      className={className}
      iconLeft={<Download className="h-4 w-4" />}
      onClick={() =>
        download(
          buildPdf(portfolioLines(user, onWards.filter((w) => w.inPortfolio))),
          "onWard-portfolio.pdf",
        )
      }
    >
      {label}
    </Button>
  );
}

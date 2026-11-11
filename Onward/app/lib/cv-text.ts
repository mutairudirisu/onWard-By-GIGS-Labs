import { cvSlug, monthYear, type CvModel } from "./cv";

/** Plain markdown: paste into an email, a Word file or LinkedIn without a converter. */
export function buildCvText(cv: CvModel): string {
  const out: string[] = [`# ${cv.name}`, ""];

  const top = [
    cv.headline,
    cv.email,
    cv.phone,
    cv.location,
    ...cv.links.map((l) => l.url.trim()),
  ].filter(Boolean);
  if (top.length) out.push(top.join(" | "), "");
  if (cv.summary) out.push(cv.summary, "");

  out.push("## Experience", "");
  if (!cv.experience.length) out.push("_No experience added yet._", "");
  for (const entry of cv.experience) {
    const heading = [entry.role, entry.project].filter(Boolean).join(" - ") || "Experience";
    out.push(`### ${heading}${entry.period ? ` (${entry.period})` : ""}`);
    if (entry.location) out.push(entry.location);
    for (const line of entry.bullets) out.push(`- ${line}`);
    if (entry.skills.length) out.push("", `Skills: ${entry.skills.join(", ")}`);
    out.push("");
  }

  if (cv.skills.length) {
    out.push(
      "## Digital Skills and Skills",
      "",
      cv.skills.map((s) => s.name).join(", "),
      "",
    );
  }

  if (cv.certifications.length) {
    out.push("## Training and Certifications", "");
    for (const item of cv.certifications) {
      const meta = [item.issuer, item.date].filter(Boolean).join(" | ");
      out.push(`- ${item.title}${meta ? ` — ${meta}` : ""}`);
      if (item.note) out.push(`  ${item.note}`);
    }
    out.push("");
  }

  if (cv.education.length) {
    out.push("## Education", "");
    for (const edu of cv.education) {
      const period = edu.start
        ? `${monthYear(edu.start)} - ${edu.end ? monthYear(edu.end) : "Present"}`
        : edu.end
          ? monthYear(edu.end)
          : "";
      const line = [
        [edu.award, edu.school].filter(Boolean).join(" - "),
        period && `(${period})`,
      ]
        .filter(Boolean)
        .join(" ");
      out.push(`- ${line}`);
      if (edu.note.trim()) out.push(`  ${edu.note.trim()}`);
    }
    out.push("");
  }

  const note = cv.experience.some((e) => e.asLogged)
    ? "Dates for logged work follow the days it was recorded, unless edited in onWard."
    : "";
  out.push(
    "---",
    `Built with onWard from ${cv.stats[0]?.value ?? 0} logged onWards. ${note}`.trim(),
    "",
  );

  return out.join("\n");
}

export function cvTextFileName(name: string) {
  return `cv-${cvSlug(name)}.md`;
}

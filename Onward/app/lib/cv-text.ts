import { cvSlug, monthYear, type CvModel } from "./cv";

/** Plain markdown: paste into an email, a Word file or LinkedIn without a converter. */
export function buildCvText(cv: CvModel): string {
  const out: string[] = [`# ${cv.name}`, ""];

  const top = [cv.headline, cv.location, cv.email, ...cv.links.map((l) => l.url.trim())].filter(
    Boolean,
  );
  if (top.length) out.push(top.join(" | "), "");
  if (cv.summary) out.push(cv.summary, "");

  out.push("## Experience", "");
  if (!cv.experience.length) out.push("_Nothing pinned to the portfolio yet._", "");
  for (const entry of cv.experience) {
    const heading = entry.role ? `${entry.role} - ${entry.project}` : entry.project;
    out.push(`### ${heading} (${entry.period})`);
    for (const line of entry.bullets) out.push(`- ${line}`);
    if (entry.skills.length) out.push("", `Skills: ${entry.skills.join(", ")}`);
    out.push("");
  }

  if (cv.skills.length) {
    out.push(
      "## Skills",
      "",
      cv.skills.map((s) => (s.count > 1 ? `${s.name} (${s.count})` : s.name)).join(", "),
      "",
    );
  }

  if (cv.education.length) {
    out.push("## Education", "");
    for (const edu of cv.education) {
      const period = [edu.start, edu.end].filter(Boolean).map(monthYear).join(" - ");
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
    ? "Dates follow the days the work was logged, unless edited in onWard."
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

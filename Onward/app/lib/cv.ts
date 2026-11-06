import { asciiFold } from "./pdf";
import type { OnWard } from "./data";

/** A URL the user adds by hand - label is what prints, url is where it goes. */
export type CvLink = { label: string; url: string };

export type CvEducation = {
  award: string;
  school: string;
  start: string; // yyyy-mm
  end: string; // yyyy-mm, blank means still there
  note: string;
};

/** What the user types over a derived group, keyed by project name. */
export type CvSpan = { role: string; start: string; end: string };

/** The whole of what persistence holds: nothing here is derived. */
export type CvDoc = {
  headline: string;
  links: CvLink[];
  education: CvEducation[];
  spans: Record<string, CvSpan>;
};

export const EMPTY_CV_DOC: CvDoc = { headline: "", links: [], education: [], spans: {} };

export type CvExperience = {
  project: string;
  role: string;
  period: string;
  /** The dates came from the log rather than from the user. */
  asLogged: boolean;
  bullets: string[];
  skills: string[];
  wards: number;
};

export type CvSkill = { name: string; count: number };

export type CvModel = {
  name: string;
  initials: string;
  email: string;
  location: string;
  headline: string;
  links: CvLink[];
  experience: CvExperience[];
  skills: CvSkill[];
  education: CvEducation[];
  summary: string;
  stats: { value: string; label: string }[];
};

type Source = {
  user: {
    name: string;
    initials: string;
    role?: string;
    location?: string;
    bio?: string;
    email?: string;
  };
  onWards: OnWard[];
  days: { day: string }[];
  doc: CvDoc;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const UNDATED = "Undated work";

/** One slug for both exports, so the PDF and the text file land as a matching pair. */
export function cvSlug(name: string) {
  return (
    asciiFold(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "onward"
  );
}

/** yyyy-mm-dd or yyyy-mm -> "Mar 2024". Anything unparsable renders as it was typed. */
export function monthYear(value: string) {
  const [year, month] = value.split("-");
  const m = Number(month);
  if (!year || !m || m < 1 || m > 12) return value;
  return `${MONTHS[m - 1]} ${year}`;
}

function firstSentence(text?: string) {
  const clean = (text ?? "").trim();
  if (!clean) return "";
  const cut = clean.match(/(^.*?[.!?])(\s|$)/);
  return (cut ? cut[1] : clean).trim();
}

/**
 * Shaped, never invented: the result clause the user wrote, then the first sentence of
 * what they wrote about it. No verbs, figures or adjectives are added here.
 */
export function shapeBullets(wards: OnWard[]): string[] {
  const lines: string[] = [];
  for (const ward of wards) {
    const impact = ward.impact?.trim() ?? "";
    const lead = firstSentence(ward.body);
    if (impact && lead && lead.toLowerCase() !== impact.toLowerCase()) {
      lines.push(impact, lead);
    } else if (impact || lead) {
      lines.push(impact || lead);
    } else if (ward.title.trim()) {
      lines.push(ward.title.trim());
    }
  }
  return lines;
}

function loggedSpan(wards: OnWard[]) {
  const dates = wards.map((w) => w.date).filter(Boolean).sort() as string[];
  if (!dates.length) return { period: UNDATED, asLogged: true };
  const from = monthYear(dates[0]);
  const to = monthYear(dates[dates.length - 1]);
  return { period: from === to ? from : `${from} - ${to}`, asLogged: true };
}

function typedSpan(span: CvSpan | undefined, wards: OnWard[]) {
  if (!span?.start.trim()) {
    if (span?.end.trim()) {
      // An end with no start is half a sentence: keep the typed end, take the start from the log.
      const logged = loggedSpan(wards);
      return {
        period: `${logged.period.split(" - ")[0]} - ${monthYear(span.end.trim())}`,
        asLogged: true,
      };
    }
    return null;
  }
  const start = monthYear(span.start.trim());
  const end = span.end.trim();
  return { period: end ? `${start} - ${monthYear(end)}` : `${start} - present`, asLogged: false };
}

function skillCounts(wards: OnWard[]): CvSkill[] {
  const counts = new Map<string, number>();
  for (const ward of wards) {
    for (const name of ward.skills) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildCv({ user, onWards, days, doc }: Source): CvModel {
  const byDateDesc = (a: OnWard, b: OnWard) => (b.date ?? "").localeCompare(a.date ?? "");
  const ordered = [...onWards].sort(byDateDesc);
  const pinned = ordered.filter((w) => w.inPortfolio);
  // Same rule as the portfolio: if nothing is pinned, the whole record is the draft.
  const list = pinned.length ? pinned : ordered;

  const groups = new Map<string, OnWard[]>();
  for (const ward of list) {
    const key = ward.project?.trim() || "Independent work";
    const bucket = groups.get(key);
    if (bucket) bucket.push(ward);
    else groups.set(key, [ward]);
  }

  const experience = [...groups.entries()]
    .map(([project, wards]) => {
      const span = typedSpan(doc.spans[project], wards) ?? loggedSpan(wards);
      const skills: string[] = [];
      for (const ward of wards) {
        for (const name of ward.skills) if (!skills.includes(name)) skills.push(name);
      }
      const dates = wards.map((w) => w.date).filter(Boolean).sort() as string[];
      return {
        project,
        role: (doc.spans[project]?.role ?? "").trim() || (user.role ?? "").trim(),
        period: span.period,
        asLogged: span.asLogged,
        bullets: shapeBullets(wards),
        skills,
        wards: wards.length,
        newest: dates.at(-1) ?? "",
      };
    })
    .sort((a, b) => b.newest.localeCompare(a.newest))
    .map(({ newest, ...entry }) => entry);

  const links = doc.links.filter((l) => l.url.trim());
  const education = doc.education.filter((e) => e.award.trim() || e.school.trim());

  return {
    name: user.name,
    initials: user.initials,
    email: user.email ?? "",
    location: (user.location ?? "").trim(),
    headline: doc.headline.trim() || (user.role ?? "").trim(),
    links,
    experience,
    skills: skillCounts(list),
    education,
    summary: (user.bio ?? "").trim(),
    stats: [
      { value: String(list.length), label: "onWards" },
      { value: String(experience.length), label: experience.length === 1 ? "role" : "roles" },
      { value: String(days.length), label: "active days" },
    ],
  };
}

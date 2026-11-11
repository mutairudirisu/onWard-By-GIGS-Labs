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

export type CvJob = {
  id: string;
  role: string;
  employer: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

export type CvCertification = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  note: string;
};

/** What the user types over a derived group, keyed by project name. */
export type CvSpan = { role: string; start: string; end: string };

/** The whole of what persistence holds: nothing here is derived. */
export type CvDoc = {
  headline: string;
  email: string;
  phone: string;
  summary: string;
  useProfileDetails: boolean;
  links: CvLink[];
  education: CvEducation[];
  spans: Record<string, CvSpan>;
  jobs: CvJob[];
  certifications: CvCertification[];
  credentialWardIds: string[];
  skills: string[];
};

export const EMPTY_CV_DOC: CvDoc = {
  headline: "",
  email: "",
  phone: "",
  summary: "",
  useProfileDetails: true,
  links: [],
  education: [],
  spans: {},
  jobs: [],
  certifications: [],
  credentialWardIds: [],
  skills: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] : "";
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/** Fill fields introduced after a user's saved CV was created. */
export function normalizeCvDoc(value: unknown): CvDoc {
  if (!isRecord(value)) return EMPTY_CV_DOC;
  const spans: CvDoc["spans"] = {};
  if (isRecord(value.spans)) {
    for (const [project, span] of Object.entries(value.spans)) {
      if (!isRecord(span)) continue;
      spans[project] = {
        role: stringField(span, "role"),
        start: stringField(span, "start"),
        end: stringField(span, "end"),
      };
    }
  }
  return {
    headline: stringField(value, "headline"),
    email: stringField(value, "email"),
    phone: stringField(value, "phone"),
    summary: stringField(value, "summary"),
    useProfileDetails:
      typeof value.useProfileDetails === "boolean" ? value.useProfileDetails : true,
    links: records(value.links).map((link) => ({
      label: stringField(link, "label"),
      url: stringField(link, "url"),
    })),
    education: records(value.education).map((education) => ({
      award: stringField(education, "award"),
      school: stringField(education, "school"),
      start: stringField(education, "start"),
      end: stringField(education, "end"),
      note: stringField(education, "note"),
    })),
    spans,
    jobs: records(value.jobs).map((job, index) => ({
      id: stringField(job, "id") || `job-${index}`,
      role: stringField(job, "role"),
      employer: stringField(job, "employer"),
      location: stringField(job, "location"),
      start: stringField(job, "start"),
      end: stringField(job, "end"),
      details: stringField(job, "details"),
    })),
    certifications: records(value.certifications).map((item, index) => ({
      id: stringField(item, "id") || `certification-${index}`,
      title: stringField(item, "title"),
      issuer: stringField(item, "issuer"),
      date: stringField(item, "date"),
      note: stringField(item, "note"),
    })),
    credentialWardIds: Array.isArray(value.credentialWardIds)
      ? value.credentialWardIds.filter((id): id is string => typeof id === "string")
      : [],
    skills: Array.isArray(value.skills)
      ? value.skills.filter((skill): skill is string => typeof skill === "string")
      : [],
  };
}

export type CvExperience = {
  id: string;
  project: string;
  role: string;
  location: string;
  period: string;
  /** The dates came from the log rather than from the user. */
  asLogged: boolean;
  bullets: string[];
  skills: string[];
  wards: number;
};

export type CvSkill = { name: string; count: number };
export type CvCredential = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  note: string;
};

export type CvModel = {
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  links: CvLink[];
  experience: CvExperience[];
  skills: CvSkill[];
  education: CvEducation[];
  certifications: CvCredential[];
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

function skillCounts(wards: OnWard[], additionalSkills: string[]): CvSkill[] {
  const counts = new Map<string, number>();
  for (const ward of wards) {
    for (const name of ward.skills) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const name of additionalSkills) {
    const clean = name.trim();
    if (clean && !counts.has(clean)) counts.set(clean, 1);
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
  const portfolio = pinned.length ? pinned : ordered;
  const credentialIds = new Set(doc.credentialWardIds);
  const workWards = portfolio.filter((ward) => !credentialIds.has(ward.id));
  const credentialWards = ordered.filter((ward) => credentialIds.has(ward.id));
  const includedWards = [...new Map([...portfolio, ...credentialWards].map((w) => [w.id, w])).values()];

  const groups = new Map<string, OnWard[]>();
  for (const ward of workWards) {
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
        id: `ward:${project}`,
        project,
        role: (doc.spans[project]?.role ?? "").trim() || (user.role ?? "").trim(),
        location: "",
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

  const manualExperience: CvExperience[] = doc.jobs
    .filter((job) => job.role.trim() || job.employer.trim() || job.details.trim())
    .map((job) => ({
      id: `job:${job.id}`,
      project: job.employer.trim(),
      role: job.role.trim(),
      location: job.location.trim(),
      period: job.start
        ? `${monthYear(job.start)} - ${job.end ? monthYear(job.end) : "Present"}`
        : job.end
          ? monthYear(job.end)
          : "",
      asLogged: false,
      bullets: job.details
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
        .filter(Boolean),
      skills: [],
      wards: 0,
    }));

  const links = doc.links.filter((l) => l.url.trim());
  const education = doc.education.filter((e) => e.award.trim() || e.school.trim());
  const certifications: CvCredential[] = [
    ...doc.certifications
      .filter((item) => item.title.trim())
      .map((item) => ({
        id: `manual:${item.id}`,
        title: item.title.trim(),
        issuer: item.issuer.trim(),
        date: item.date ? monthYear(item.date) : "",
        note: item.note.trim(),
      })),
    ...credentialWards.map((ward) => ({
      id: `ward:${ward.id}`,
      title: ward.title.trim(),
      issuer: "",
      date: ward.date ? monthYear(ward.date) : "",
      note: ward.impact?.trim() ?? "",
    })),
  ];

  return {
    name: user.name,
    initials: user.initials,
    email: doc.email.trim() || (doc.useProfileDetails ? user.email || "" : ""),
    phone: doc.phone.trim(),
    location: doc.useProfileDetails ? (user.location ?? "").trim() : "",
    headline: doc.headline.trim() || (doc.useProfileDetails ? (user.role ?? "").trim() : ""),
    links,
    experience: [...manualExperience, ...experience],
    skills: skillCounts(includedWards, doc.skills),
    education,
    certifications,
    summary: doc.summary.trim() || (doc.useProfileDetails ? (user.bio ?? "").trim() : ""),
    stats: [
      { value: String(includedWards.length), label: "onWards" },
      {
        value: String(manualExperience.length + experience.length),
        label: manualExperience.length + experience.length === 1 ? "role" : "roles",
      },
      { value: String(days.length), label: "active days" },
    ],
  };
}

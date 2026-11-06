"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackButton, Button, Field, Tag, TextInput } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { useAuth, useCurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";
import { toastError, toastSuccess } from "@/components/toast";
import { useActivity } from "@/lib/activity";
import { downloadBlob } from "@/lib/download";
import { fetchCvDoc, saveCvDoc } from "@/lib/db";
import {
  buildCv,
  EMPTY_CV_DOC,
  type CvDoc,
  type CvEducation,
  type CvLink,
  type CvSpan,
} from "@/lib/cv";
import { buildCvPdf, cvFileName } from "@/lib/cv-pdf";
import { buildCvText, cvTextFileName } from "@/lib/cv-text";
import { Download, FileText, Plus, Sprout, X } from "lucide-react";

const EMPTY_LINK: CvLink = { label: "", url: "" };
const EMPTY_EDU: CvEducation = { award: "", school: "", start: "", end: "", note: "" };

export default function CvPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const profile = useCurrentUser();
  const { onWards } = useStore();
  const { days } = useActivity();

  const [doc, setDoc] = useState<CvDoc>(EMPTY_CV_DOC);
  const [saved, setSaved] = useState<CvDoc>(EMPTY_CV_DOC);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchCvDoc(userId).then((d) => {
      if (cancelled) return;
      setDoc(d);
      setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const cv = buildCv({ user: profile, onWards, days, doc });
  const dirty = JSON.stringify(doc) !== JSON.stringify(saved);

  const setSpan = (project: string, patch: Partial<CvSpan>) =>
    setDoc((d) => {
      const base: CvSpan = d.spans[project] ?? { role: "", start: "", end: "" };
      return { ...d, spans: { ...d.spans, [project]: { ...base, ...patch } } };
    });

  const setLink = (i: number, patch: Partial<CvLink>) =>
    setDoc((d) => ({ ...d, links: d.links.map((l, n) => (n === i ? { ...l, ...patch } : l)) }));

  const setEdu = (i: number, patch: Partial<CvEducation>) =>
    setDoc((d) => ({ ...d, education: d.education.map((e, n) => (n === i ? { ...e, ...patch } : e)) }));

  async function save() {
    if (!userId) return;
    setBusy(true);
    try {
      await saveCvDoc(userId, doc);
      setSaved(doc);
      toastSuccess("CV details saved");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Couldn't save your CV details");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BackButton label="Back to profile" fallback="/profile" />
          <span className="flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.2} />
            <Wordmark className="text-[12px]" />
          </span>
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          Curriculum vitae
        </span>
      </div>

      <section className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
          {cv.name || "Your name"}
        </h1>
        {cv.headline ? (
          <p className="mt-1 text-[11px] font-semibold text-inksoft">{cv.headline}</p>
        ) : null}
        {cv.location ? <p className="text-[9px] text-muted">{cv.location}</p> : null}
        {cv.summary ? (
          <p className="mt-3 text-[10.5px] leading-[1.6] text-inksoft">{cv.summary}</p>
        ) : null}
      </section>

      <div className="mb-5 grid grid-cols-3 gap-2 text-center">
        {cv.stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-paper px-2 py-2.5">
            <p className="text-[16px] font-bold leading-none tracking-tight text-ink">{s.value}</p>
            <p className="mt-1 text-[8px] font-semibold leading-tight text-inksoft">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">Experience</h2>
      {cv.experience.length ? (
        <div className="mb-5 space-y-2.5">
          {cv.experience.map((entry) => (
            <article key={entry.project} className="card px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[12.5px] font-bold tracking-tight text-ink">
                  {entry.role || entry.project}
                </h3>
                <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {entry.period}
                </span>
              </div>
              {entry.role ? (
                <p className="mt-0.5 text-[9px] text-muted">{entry.project}</p>
              ) : null}
              <ul className="mt-2 space-y-1.5">
                {entry.bullets.map((line, i) => (
                  <li key={i} className="flex gap-2 text-[10px] leading-[1.55] text-inksoft">
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-lime-deep" />
                    {line}
                  </li>
                ))}
              </ul>
              {entry.skills.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {entry.skills.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="card mb-5 px-4 py-6 text-center">
          <p className="text-[12px] font-semibold text-ink">Nothing to write up yet</p>
          <p className="tiny mt-1">
            Log onWards, pin the ones you would show an employer, and they group themselves into
            roles here.
          </p>
        </div>
      )}

      <h2 className="mb-1.5 text-[13px] font-bold tracking-tight text-ink">
        Add what the log cannot tell
      </h2>
      <p className="mb-3 text-[9.5px] leading-[1.55] text-muted">
        Bullets come from your own words, so they are never edited here. Only these details are
        stored; everything else is read from your onWards each time you open the page.
      </p>

      <div className="card mb-5 space-y-4 px-4 py-4">
        <Field label="Headline" uppercase>
          <TextInput
            value={doc.headline}
            onChange={(e) => setDoc((d) => ({ ...d, headline: e.target.value }))}
            placeholder={profile.role || "e.g. Frontend developer"}
            maxLength={70}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Links
          </span>
          <div className="space-y-2.5">
            {doc.links.map((link, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <TextInput
                    value={link.label}
                    onChange={(e) => setLink(i, { label: e.target.value })}
                    placeholder="Portfolio"
                    maxLength={24}
                  />
                  <TextInput
                    value={link.url}
                    onChange={(e) => setLink(i, { url: e.target.value })}
                    placeholder="https://"
                    inputMode="url"
                    maxLength={140}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove link"
                  onClick={() =>
                    setDoc((d) => ({ ...d, links: d.links.filter((_, n) => n !== i) }))
                  }
                  className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="quiet"
            full={false}
            className="mt-1.5 -ml-2 text-[11px]"
            iconLeft={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setDoc((d) => ({ ...d, links: [...d.links, EMPTY_LINK] }))}
          >
            Add link
          </Button>
        </div>

        {cv.experience.length ? (
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Roles and dates
            </span>
            <div className="space-y-3.5">
              {cv.experience.map((entry) => {
                const span = doc.spans[entry.project];
                return (
                  <div key={entry.project}>
                    <p className="mb-1.5 text-[10px] font-semibold text-ink">{entry.project}</p>
                    <div className="space-y-1.5">
                      <TextInput
                        value={span?.role ?? ""}
                        onChange={(e) => setSpan(entry.project, { role: e.target.value })}
                        placeholder="Role title"
                        maxLength={60}
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <TextInput
                          type="month"
                          value={span?.start ?? ""}
                          onChange={(e) => setSpan(entry.project, { start: e.target.value })}
                          aria-label={`${entry.project} start`}
                        />
                        <TextInput
                          type="month"
                          value={span?.end ?? ""}
                          onChange={(e) => setSpan(entry.project, { end: e.target.value })}
                          aria-label={`${entry.project} end`}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-[8.5px] leading-[1.5] text-faint">
                      {span?.start
                        ? span.end
                          ? "Showing the dates you typed."
                          : "Showing as running from the month you typed."
                        : `Currently showing ${entry.period.toLowerCase()}. Leave both empty to keep that.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Education
          </span>
          <div className="space-y-2.5">
            {doc.education.map((edu, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <TextInput
                    value={edu.award}
                    onChange={(e) => setEdu(i, { award: e.target.value })}
                    placeholder="BSc Computer Science"
                    maxLength={80}
                  />
                  <TextInput
                    value={edu.school}
                    onChange={(e) => setEdu(i, { school: e.target.value })}
                    placeholder="School"
                    maxLength={80}
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <TextInput
                      type="month"
                      value={edu.start}
                      onChange={(e) => setEdu(i, { start: e.target.value })}
                      aria-label="Started"
                    />
                    <TextInput
                      type="month"
                      value={edu.end}
                      onChange={(e) => setEdu(i, { end: e.target.value })}
                      aria-label="Finished"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Remove education"
                  onClick={() =>
                    setDoc((d) => ({ ...d, education: d.education.filter((_, n) => n !== i) }))
                  }
                  className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="quiet"
            full={false}
            className="mt-1.5 -ml-2 text-[11px]"
            iconLeft={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setDoc((d) => ({ ...d, education: [...d.education, EMPTY_EDU] }))}
          >
            Add education
          </Button>
        </div>

        <Button variant="secondary" onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save details" : "Details saved"}
        </Button>
      </div>

      <div className="space-y-2">
        <Button
          iconLeft={<Download className="h-4 w-4" />}
          onClick={() =>
            downloadBlob(buildCvPdf(cv), cvFileName(cv.name || "my-cv"))
          }
        >
          Download CV PDF
        </Button>
        <Button
          variant="secondary"
          iconLeft={<FileText className="h-4 w-4" />}
          onClick={() =>
            downloadBlob(
              new Blob([buildCvText(cv)], { type: "text/markdown" }),
              cvTextFileName(cv.name || "my-cv"),
            )
          }
        >
          Download plain text
        </Button>
      </div>

      <p className="mt-5 text-center text-[8px] leading-[1.6] text-faint">
        Every line is your own writing, grouped by the project you named. Metrics are self-reported
        from the work logged in onWard.
      </p>
    </PhoneShell>
  );
}

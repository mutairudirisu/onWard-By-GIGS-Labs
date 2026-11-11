"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackButton, Button, Field, TextArea, TextInput } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { CvPreview } from "@/components/cv-preview";
import { useAuth, useCurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";
import { toastError, toastSuccess } from "@/components/toast";
import { useActivity } from "@/lib/activity";
import { downloadBlob } from "@/lib/download";
import { fetchCvDoc, saveCvDoc, uuid } from "@/lib/db";
import {
  buildCv,
  EMPTY_CV_DOC,
  type CvCertification,
  type CvDoc,
  type CvEducation,
  type CvJob,
  type CvLink,
  type CvSpan,
} from "@/lib/cv";
import { buildCvPdf, cvFileName } from "@/lib/cv-pdf";
import { buildCvText, cvTextFileName } from "@/lib/cv-text";
import { Award, Download, FileText, Plus, Sprout, X } from "lucide-react";

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[13px] font-bold tracking-tight text-ink">{title}</h2>
      {hint ? <p className="mt-1 text-[10px] leading-[1.55] text-muted">{hint}</p> : null}
    </div>
  );
}

function monthPeriod(start: string, end: string) {
  if (!start) return end;
  const format = (value: string) => {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  if (end === start) return format(start);
  return `${format(start)} - ${end ? format(end) : "Present"}`;
}

export default function CvPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const profile = useCurrentUser();
  const { onWards } = useStore();
  const { days } = useActivity();

  const [doc, setDoc] = useState<CvDoc>(EMPTY_CV_DOC);
  const [saved, setSaved] = useState<CvDoc>(EMPTY_CV_DOC);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void fetchCvDoc(userId)
      .then((next) => {
        if (cancelled) return;
        setDoc(next);
        setSaved(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(true);
          toastError(error instanceof Error ? error.message : "Couldn't load your CV details");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const cv = buildCv({
    user: { ...profile, email: user?.email ?? "" },
    onWards,
    days,
    doc,
  });
  const dirty = JSON.stringify(doc) !== JSON.stringify(saved);

  const setSpan = (project: string, patch: Partial<CvSpan>) =>
    setDoc((current) => {
      const base = current.spans[project] ?? { role: "", start: "", end: "" };
      return { ...current, spans: { ...current.spans, [project]: { ...base, ...patch } } };
    });

  const setJob = (id: string, patch: Partial<CvJob>) =>
    setDoc((current) => ({
      ...current,
      jobs: current.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    }));

  const setCertification = (id: string, patch: Partial<CvCertification>) =>
    setDoc((current) => ({
      ...current,
      certifications: current.certifications.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));

  const setEducation = (index: number, patch: Partial<CvEducation>) =>
    setDoc((current) => ({
      ...current,
      education: current.education.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const setLink = (index: number, patch: Partial<CvLink>) =>
    setDoc((current) => ({
      ...current,
      links: current.links.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const portfolioWards = onWards.filter((ward) => ward.inPortfolio);
  const workSource = portfolioWards.length ? portfolioWards : onWards;
  const credentialIds = new Set(doc.credentialWardIds);
  const workGroups = new Map<string, typeof onWards>();
  for (const ward of workSource) {
    if (credentialIds.has(ward.id)) continue;
    const project = ward.project?.trim() || "Independent work";
    const group = workGroups.get(project) ?? [];
    group.push(ward);
    workGroups.set(project, group);
  }

  async function save() {
    if (!userId || !dirty || busy || loadError) return;
    setBusy(true);
    try {
      await saveCvDoc(userId, doc);
      setSaved(doc);
      toastSuccess("CV details saved");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't save your CV details");
    } finally {
      setBusy(false);
    }
  }

  function addSkill() {
    const name = skillDraft.trim();
    if (!name || cv.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    setDoc((current) => ({ ...current, skills: [...current.skills, name] }));
    setSkillDraft("");
  }

  function toggleCredentialWard(id: string) {
    setDoc((current) => ({
      ...current,
      credentialWardIds: current.credentialWardIds.includes(id)
        ? current.credentialWardIds.filter((wardId) => wardId !== id)
        : [...current.credentialWardIds, id],
    }));
  }

  return (
    <PhoneShell wide>
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <BackButton label="Back to profile" fallback="/profile" />
          <span className="flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.2} />
            <Wordmark className="text-[12px]" />
          </span>
        </span>
        <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-muted sm:inline">
          CV builder · Free template
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lime-deep">
            Your experience, ready to share
          </p>
          <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight text-ink lg:text-[30px]">
            Build your CV
          </h1>
          <p className="mt-1 max-w-[620px] text-[11px] leading-[1.6] text-muted">
            We bring in your profile, skills and selected onWards. Add the details only you know,
            then preview and download.
          </p>
        </div>
        <Button
          variant="secondary"
          className="!w-auto !px-4 !py-2.5 text-[11px]"
          disabled={loading || busy || loadError || !dirty}
          onClick={save}
        >
          {loading ? "Loading…" : busy ? "Saving…" : dirty ? "Save CV" : "All changes saved"}
        </Button>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] xl:gap-10">
        <div className="min-w-0 space-y-5">
          <section className="card space-y-4 px-4 py-4">
            <SectionHeading
              title="Profile and contact"
              hint="Your name and location come from your onWard profile. Update them there if needed."
            />
            {loadError ? (
              <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-[10px] text-danger">
                Your saved CV could not be loaded. Refresh before editing so existing details are not
                overwritten.
              </p>
            ) : null}
            <Field label="CV headline" uppercase>
              <TextInput
                value={doc.headline}
                onChange={(event) =>
                  setDoc((current) => ({ ...current, headline: event.target.value }))
                }
                placeholder={profile.role || "e.g. Operations coordinator"}
                maxLength={70}
              />
            </Field>
            <Field label="Email" uppercase>
              <TextInput
                type="email"
                value={doc.email}
                onChange={(event) =>
                  setDoc((current) => ({ ...current, email: event.target.value }))
                }
                placeholder={user?.email || "you@example.com"}
                maxLength={120}
              />
            </Field>
            <Field label="Phone (optional)" uppercase>
              <TextInput
                type="tel"
                value={doc.phone}
                onChange={(event) =>
                  setDoc((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Add a contact number"
                maxLength={40}
              />
            </Field>
            <Field label="Professional summary" uppercase>
              <TextArea
                value={doc.summary}
                onChange={(event) =>
                  setDoc((current) => ({ ...current, summary: event.target.value }))
                }
                placeholder={profile.bio || "A short introduction about your work and strengths."}
                maxLength={700}
                rows={4}
              />
            </Field>
            <label className="flex cursor-pointer items-start gap-2 text-[10px] leading-[1.5] text-muted">
              <input
                type="checkbox"
                checked={doc.useProfileDetails}
                onChange={(event) =>
                  setDoc((current) => ({
                    ...current,
                    useProfileDetails: event.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 accent-lime-deep"
              />
              Use my profile details for any blank headline, email, location or summary fields.
            </label>
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Professional links
              </span>
              <div className="space-y-2.5">
                {doc.links.map((link, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)]">
                      <TextInput
                        value={link.label}
                        onChange={(event) => setLink(index, { label: event.target.value })}
                        placeholder="LinkedIn"
                        aria-label="Link label"
                        maxLength={30}
                      />
                      <TextInput
                        value={link.url}
                        onChange={(event) => setLink(index, { url: event.target.value })}
                        placeholder="https://"
                        aria-label="Link URL"
                        inputMode="url"
                        maxLength={200}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove link"
                      onClick={() =>
                        setDoc((current) => ({
                          ...current,
                          links: current.links.filter((_, i) => i !== index),
                        }))
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="quiet"
                full={false}
                className="mt-1.5 -ml-2 text-[11px]"
                iconLeft={<Plus className="h-3.5 w-3.5" />}
                onClick={() =>
                  setDoc((current) => ({
                    ...current,
                    links: [...current.links, { label: "", url: "" }],
                  }))
                }
              >
                Add link
              </Button>
            </div>
          </section>

          <section className="card px-4 py-4">
            <SectionHeading
              title="Experience from your onWards"
              hint="Pin work to your portfolio to choose what appears here. If none are pinned, your log is used. Entries remain unchanged."
            />
            {workGroups.size ? (
              <div className="space-y-4">
                {[...workGroups.entries()].map(([project, wards]) => {
                  const span = doc.spans[project];
                  const dates = wards
                    .map((ward) => ward.date)
                    .filter((date): date is string => Boolean(date))
                    .sort();
                  const periodStart = span?.start || dates[0] || "";
                  const periodEnd = span?.end || (!span?.start ? dates.at(-1) || "" : "");
                  const datesLabel =
                    monthPeriod(periodStart, periodEnd) || "Dates follow when the onWards were logged.";
                  return (
                    <div key={project} className="border-t border-line pt-3 first:border-0 first:pt-0">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="min-w-0 truncate text-[11px] font-bold text-ink">
                          {project}
                        </h3>
                        <span className="shrink-0 text-[9px] text-muted">
                          {wards.length} onWard{wards.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <TextInput
                          value={span?.role ?? ""}
                          onChange={(event) =>
                            setSpan(project, { role: event.target.value })
                          }
                          placeholder={profile.role || "Role title"}
                          aria-label={`${project} role`}
                          maxLength={60}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <TextInput
                            type="month"
                            value={span?.start ?? ""}
                            onChange={(event) =>
                              setSpan(project, { start: event.target.value })
                            }
                            aria-label={`${project} start date`}
                          />
                          <TextInput
                            type="month"
                            value={span?.end ?? ""}
                            onChange={(event) =>
                              setSpan(project, { end: event.target.value })
                            }
                            aria-label={`${project} end date`}
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-[9px] text-faint">
                        {datesLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-cream px-3 py-3 text-[10px] leading-[1.6] text-muted">
                Pin onWards to your portfolio to include them here, or add your work history below.
              </p>
            )}
          </section>

          <section className="card px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <SectionHeading
                title="Other work experience"
                hint="Add roles that are not in your onWard log. One result or responsibility per line."
              />
              <button
                type="button"
                onClick={() =>
                  setDoc((current) => ({
                    ...current,
                    jobs: [
                      ...current.jobs,
                      {
                        id: uuid(),
                        role: "",
                        employer: "",
                        location: "",
                        start: "",
                        end: "",
                        details: "",
                      },
                    ],
                  }))
                }
                className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-lime-soft px-3 text-[10px] font-bold text-ink transition hover:bg-lime"
              >
                <Plus className="h-3.5 w-3.5" /> Add role
              </button>
            </div>
            {doc.jobs.length ? (
              <div className="space-y-4">
                {doc.jobs.map((job, index) => (
                  <div key={job.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-ink">Role {index + 1}</p>
                      <button
                        type="button"
                        aria-label={`Remove role ${index + 1}`}
                        onClick={() =>
                          setDoc((current) => ({
                            ...current,
                            jobs: current.jobs.filter((item) => item.id !== job.id),
                          }))
                        }
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <TextInput
                        value={job.role}
                        onChange={(event) => setJob(job.id, { role: event.target.value })}
                        placeholder="Job title"
                        aria-label={`Role ${index + 1} title`}
                        maxLength={80}
                      />
                      <TextInput
                        value={job.employer}
                        onChange={(event) => setJob(job.id, { employer: event.target.value })}
                        placeholder="Company or organisation"
                        aria-label={`Role ${index + 1} company`}
                        maxLength={100}
                      />
                      <TextInput
                        value={job.location}
                        onChange={(event) => setJob(job.id, { location: event.target.value })}
                        placeholder="Location (optional)"
                        aria-label={`Role ${index + 1} location`}
                        maxLength={80}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          type="month"
                          value={job.start}
                          onChange={(event) => setJob(job.id, { start: event.target.value })}
                          aria-label={`Role ${index + 1} start date`}
                        />
                        <TextInput
                          type="month"
                          value={job.end}
                          onChange={(event) => setJob(job.id, { end: event.target.value })}
                          aria-label={`Role ${index + 1} end date`}
                        />
                      </div>
                      <TextArea
                        value={job.details}
                        onChange={(event) => setJob(job.id, { details: event.target.value })}
                        placeholder={"Led a project that...\nImproved ... by ..."}
                        aria-label={`Role ${index + 1} responsibilities and results`}
                        maxLength={1800}
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setDoc((current) => ({
                    ...current,
                    jobs: [
                      ...current.jobs,
                      {
                        id: uuid(),
                        role: "",
                        employer: "",
                        location: "",
                        start: "",
                        end: "",
                        details: "",
                      },
                    ],
                  }))
                }
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line py-4 text-[10px] font-semibold text-muted hover:border-lime-deep hover:text-ink"
              >
                <Plus className="h-4 w-4" /> Add work experience
              </button>
            )}
          </section>

          <section className="card px-4 py-4">
            <SectionHeading
              title="Digital skills and skills"
              hint="Skills from your onWards appear automatically. Add others you want employers to see."
            />
            {cv.skills.length ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {cv.skills.map((skill) => {
                  const manuallyAdded = doc.skills.some(
                    (name) => name.toLowerCase() === skill.name.toLowerCase(),
                  );
                  return (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-1 rounded-full bg-lime-pale py-1 pl-2.5 pr-1 text-[10px] font-semibold text-ink"
                    >
                      {skill.name}
                      {manuallyAdded ? (
                        <button
                          type="button"
                          aria-label={`Remove ${skill.name}`}
                          onClick={() =>
                            setDoc((current) => ({
                              ...current,
                              skills: current.skills.filter(
                                (name) => name.toLowerCase() !== skill.name.toLowerCase(),
                              ),
                            }))
                          }
                          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full hover:bg-lime-soft"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mb-3 text-[10px] text-muted">Add a skill or log one on an onWard.</p>
            )}
            <div className="flex gap-2">
              <TextInput
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value.slice(0, 40))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. Excel, project planning"
                aria-label="Add a skill"
                maxLength={40}
              />
              <Button
                variant="secondary"
                full={false}
                className="!px-3"
                disabled={!skillDraft.trim()}
                onClick={addSkill}
                aria-label="Add skill"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="card px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <SectionHeading
                title="Training and certifications"
                hint="Choose only onWards that really represent training or a certification, or add one manually."
              />
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" />
            </div>

            {onWards.length ? (
              <fieldset className="mb-4">
                <legend className="mb-2 text-[10px] font-semibold text-ink">
                  Include from your onWards
                </legend>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-cream p-2">
                  {onWards.map((ward) => (
                    <label
                      key={ward.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-paper"
                    >
                      <input
                        type="checkbox"
                        checked={credentialIds.has(ward.id)}
                        onChange={() => toggleCredentialWard(ward.id)}
                        className="mt-0.5 accent-[var(--lime-deep)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold text-ink [overflow-wrap:anywhere]">
                          {ward.title}
                        </span>
                        <span className="block text-[9px] text-muted">
                          {[ward.project, ward.dateLabel].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {doc.certifications.length ? (
              <div className="space-y-4">
                {doc.certifications.map((item, index) => (
                  <div key={item.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-ink">Credential {index + 1}</p>
                      <button
                        type="button"
                        aria-label={`Remove credential ${index + 1}`}
                        onClick={() =>
                          setDoc((current) => ({
                            ...current,
                            certifications: current.certifications.filter(
                              (credential) => credential.id !== item.id,
                            ),
                          }))
                        }
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <TextInput
                        value={item.title}
                        onChange={(event) =>
                          setCertification(item.id, { title: event.target.value })
                        }
                        placeholder="Certificate or training name"
                        aria-label={`Credential ${index + 1} name`}
                        maxLength={100}
                      />
                      <TextInput
                        value={item.issuer}
                        onChange={(event) =>
                          setCertification(item.id, { issuer: event.target.value })
                        }
                        placeholder="Issuing organisation"
                        aria-label={`Credential ${index + 1} issuer`}
                        maxLength={100}
                      />
                      <TextInput
                        type="month"
                        value={item.date}
                        onChange={(event) =>
                          setCertification(item.id, { date: event.target.value })
                        }
                        aria-label={`Credential ${index + 1} date`}
                      />
                      <TextArea
                        value={item.note}
                        onChange={(event) =>
                          setCertification(item.id, { note: event.target.value })
                        }
                        placeholder="Optional detail"
                        aria-label={`Credential ${index + 1} details`}
                        maxLength={400}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <Button
              variant="quiet"
              full={false}
              className="mt-2 -ml-2 text-[11px]"
              iconLeft={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                setDoc((current) => ({
                  ...current,
                  certifications: [
                    ...current.certifications,
                    { id: uuid(), title: "", issuer: "", date: "", note: "" },
                  ],
                }))
              }
            >
              Add training or certification
            </Button>
          </section>

          <section className="card px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <SectionHeading title="Education" hint="Add your education and relevant details." />
              <button
                type="button"
                onClick={() =>
                  setDoc((current) => ({
                    ...current,
                    education: [
                      ...current.education,
                      { award: "", school: "", start: "", end: "", note: "" },
                    ],
                  }))
                }
                className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-lime-soft px-3 text-[10px] font-bold text-ink transition hover:bg-lime"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {doc.education.length ? (
              <div className="space-y-4">
                {doc.education.map((item, index) => (
                  <div key={index} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-ink">Education {index + 1}</p>
                      <button
                        type="button"
                        aria-label={`Remove education ${index + 1}`}
                        onClick={() =>
                          setDoc((current) => ({
                            ...current,
                            education: current.education.filter((_, i) => i !== index),
                          }))
                        }
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <TextInput
                        value={item.award}
                        onChange={(event) => setEducation(index, { award: event.target.value })}
                        placeholder="Degree or qualification"
                        aria-label={`Education ${index + 1} qualification`}
                        maxLength={100}
                      />
                      <TextInput
                        value={item.school}
                        onChange={(event) => setEducation(index, { school: event.target.value })}
                        placeholder="School or institution"
                        aria-label={`Education ${index + 1} school`}
                        maxLength={100}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          type="month"
                          value={item.start}
                          onChange={(event) => setEducation(index, { start: event.target.value })}
                          aria-label={`Education ${index + 1} start date`}
                        />
                        <TextInput
                          type="month"
                          value={item.end}
                          onChange={(event) => setEducation(index, { end: event.target.value })}
                          aria-label={`Education ${index + 1} end date`}
                        />
                      </div>
                      <TextArea
                        value={item.note}
                        onChange={(event) => setEducation(index, { note: event.target.value })}
                        placeholder="Optional detail, award or relevant coursework"
                        aria-label={`Education ${index + 1} details`}
                        maxLength={400}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted">No education added yet.</p>
            )}
          </section>

          <Button onClick={save} disabled={loading || busy || loadError || !dirty}>
            {loading ? "Loading CV…" : busy ? "Saving…" : dirty ? "Save CV details" : "CV details saved"}
          </Button>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:flex xl:h-[calc(100dvh-3rem)] xl:flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-ink">Live preview</p>
              <p className="text-[9px] text-muted">Free · clean, ATS-friendly layout</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-lime-pale px-2.5 py-1 text-[9px] font-semibold text-ink">
              <Sprout className="h-3 w-3 text-lime-deep" /> onWard
            </span>
          </div>
          <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-2xl bg-cream p-3 sm:p-5 xl:min-h-0 xl:max-h-none xl:flex-1">
            <CvPreview cv={cv} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              iconLeft={<Download className="h-4 w-4" />}
              className="!py-2.5 text-[11px]"
              disabled={loading || loadError}
              onClick={() => downloadBlob(buildCvPdf(cv), cvFileName(cv.name || "my-cv"))}
            >
              Download PDF
            </Button>
            <Button
              variant="secondary"
              iconLeft={<FileText className="h-4 w-4" />}
              className="!py-2.5 text-[11px]"
              disabled={loading || loadError}
              onClick={() =>
                downloadBlob(
                  new Blob([buildCvText(cv)], { type: "text/markdown" }),
                  cvTextFileName(cv.name || "my-cv"),
                )
              }
            >
              Download text
            </Button>
          </div>
          <p className="mt-2 text-center text-[9px] leading-[1.55] text-muted">
            Your logged wins stay in your onWards. Exports contain only the details you include here.
          </p>
        </aside>
      </div>
    </PhoneShell>
  );
}

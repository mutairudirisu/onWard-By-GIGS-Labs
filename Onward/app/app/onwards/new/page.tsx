"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { DictateTextArea } from "@/components/dictate-field";
import { BackLink, Button, Field, TextInput, Toggle } from "@/components/ui";
import { ProBadge, UpgradeModal } from "@/components/pro";
import { useStore } from "@/components/store";
import { type Evidence } from "@/lib/data";
import { todayISO } from "@/lib/dates";
import { uuid } from "@/lib/db";
import {
  Check,
  File as FileIcon,
  Globe,
  Image as ImageIcon,
  Link2,
  Plus,
  Sprout,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

function kindIcon(kind: Evidence["kind"], className = "h-4 w-4") {
  if (kind === "url") return <Globe className={className} />;
  if (kind === "image") return <ImageIcon className={className} />;
  return <FileIcon className={className} />;
}

export default function LogOnWardPage() {
  const router = useRouter();
  const {
    onWards,
    hydrated,
    selectedDate,
    skills: allSkills,
    addSkill,
    addOnWard,
    updateOnWard,
    wardsThisMonth,
    limits,
  } = useStore();
  const [wardGate, setWardGate] = useState(false);
  const [evidenceGate, setEvidenceGate] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate || todayISO());
  const [project, setProject] = useState("");
  const [body, setBody] = useState("");
  const [impact, setImpact] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [inPortfolio, setInPortfolio] = useState(true);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  /** Set from ?edit= on the way in, so a reload lands back on the same entry. */
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Student cards arrive as /onwards/new?title=Coursework&project=Coursework.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const editing = query.get("edit");
    if (editing) {
      setEditId(editing);
      return;
    }
    const presetProject = query.get("project");
    const presetTitle = query.get("title");
    if (!presetProject && !presetTitle) return;
    if (presetProject) setProject(presetProject);
    if (presetTitle) {
      setTitle(presetTitle);
      // Selected, so typing replaces the label; End or → keeps it and continues.
      requestAnimationFrame(() => {
        const field = document.getElementById("ward-title") as HTMLInputElement | null;
        field?.focus();
        field?.select();
      });
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const ward = editId ? onWards.find((w) => w.id === editId) : undefined;

  // Once, from whatever the store holds when the entry turns up: after this the
  // fields are yours, and a background refresh must not rewrite what you typed.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!ward || prefilled) return;
    setTitle(ward.title);
    setDate(ward.date ?? todayISO());
    setProject(ward.project ?? "");
    setBody(ward.body ?? "");
    setImpact(ward.impact ?? "");
    setSkills(ward.skills);
    setEvidence(ward.evidence ?? []);
    setInPortfolio(ward.inPortfolio);
    setPrefilled(true);
  }, [ward, prefilled]);

  const toggleSkill = (name: string) =>
    setSkills((list) => (list.includes(name) ? list.filter((x) => x !== name) : [...list, name]));

  const commitSkill = () => {
    const name = skillDraft.trim();
    if (!name) return;
    if (!skills.includes(name)) setSkills((l) => [...l, name]);
    addSkill(name);
    setSkillDraft("");
    setShowSkillInput(false);
  };

  const evidenceFull = () => {
    if (limits.evidencePerWard != null && evidence.length >= limits.evidencePerWard) {
      setEvidenceGate(true);
      return true;
    }
    return false;
  };

  const addFileLike = (file: File, kind: "file" | "image") => {
    if (evidenceFull()) return;
    const kb = Math.max(1, Math.round(file.size / 1024));
    setEvidence((e) => [...e, { id: uuid(), kind, label: file.name, meta: `${kb} KB · just now` }]);
  };

  const addUrl = () => {
    const raw = urlDraft.trim();
    if (!raw) return;
    if (evidenceFull()) return;
    let label = raw;
    try {
      label = new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw as label */
    }
    setEvidence((e) => [...e, { id: uuid(), kind: "url", label, meta: raw }]);
    setUrlDraft("");
    setShowUrlInput(false);
  };

  const removeEvidence = (id: string) => setEvidence((e) => e.filter((x) => x.id !== id));

  const canSave = title.trim().length > 0 && impact.trim().length > 0;
  const canAttach = limits.evidencePerWard == null || limits.evidencePerWard > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      title: title.trim(),
      impact: impact.trim(),
      body: body.trim() || undefined,
      project: project.trim() || undefined,
      skills,
      evidence,
      inPortfolio,
      date,
    };
    // Rewriting an entry you already have costs no new slot from the monthly cap.
    if (ward) {
      updateOnWard(ward.id, data);
      router.push(`/onwards/${ward.id}`);
      return;
    }
    if (limits.wardsPerMonth != null && wardsThisMonth >= limits.wardsPerMonth) {
      setWardGate(true);
      return;
    }
    const id = addOnWard(data);
    router.push(`/onwards/${id}`);
  };

  const suggestions = allSkills.filter((s) => !skills.includes(s)).slice(0, 4);

  // Nothing is editable until the entry is in hand: an empty form that fills itself
  // in a moment later would sit on top of whatever you had started typing.
  if (editId && !ward) {
    return (
      <PhoneShell>
        <div className="mb-4 flex items-center gap-1">
          <BackLink href={`/onwards/${editId}`} label="Back to the onWard" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Edit this onWard</h1>
        </div>
        <p className="card px-4 py-6 text-center text-[12px] text-muted">
          {hydrated ? "This onWard is no longer in your journal." : "Fetching this onWard…"}
        </p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="mb-4 flex items-center gap-1">
        <BackLink
          href={ward ? `/onwards/${ward.id}` : "/onwards"}
          label={ward ? "Back to the onWard" : "Back to onWards"}
        />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">
          {ward ? "Edit this onWard" : "Log an onWard"}
        </h1>
      </div>

      {ward ? null : (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-lime-deep/40 bg-lime-soft px-3 py-2">
          <Sprout className="h-3.5 w-3.5 text-inksoft" />
          <span className="truncate text-[10px] font-medium text-inksoft">
            Every piece of work is a step forward — capture the win.
          </span>
        </div>
      )}

      {limits.wardsPerMonth != null && !ward ? (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-cream px-3 py-2">
          <span className="text-[10.5px] font-semibold text-inksoft">
            {Math.min(wardsThisMonth, limits.wardsPerMonth)} of {limits.wardsPerMonth} free onWards used this month
          </span>
          <Link
            href="/upgrade"
            className="flex items-center gap-1 text-[10.5px] font-bold text-lime-deep hover:text-ink"
          >
            <ProBadge /> Go Pro
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        <Field label="Give your work a title">
          <TextInput
            id="ward-title"
            autoFocus={!editId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you accomplish?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date completed">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              aria-label="Date completed"
              className="field-input pr-10"
            />
          </Field>
          <Field label="Project">
            <TextInput value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Atlas" />
          </Field>
        </div>

        <Field label="What did you do?">
          <DictateTextArea
            value={body}
            onChange={setBody}
            placeholder="Describe the work behind the win."
            label="Dictate what you did"
          />
        </Field>

        <Field label="What changed because of your work?">
          <DictateTextArea
            value={impact}
            onChange={setImpact}
            placeholder="The specific result."
            label="Dictate the result"
          />
          <p className="mt-1.5 text-[9px] text-muted">
            Specific results turn a busy day into credible evidence.
          </p>
        </Field>

        <div>
          <span className="label">Skills you used</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {skills.map((s) => (
              <span key={s} className="tag gap-1.5 py-1.5">
                {s}
                <button type="button" aria-label={`Remove ${s}`} onClick={() => toggleSkill(s)} className="text-muted">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!showSkillInput ? (
              <button
                type="button"
                onClick={() => setShowSkillInput(true)}
                className="tag border border-dashed border-dash bg-transparent py-1.5"
              >
                + Add skill
              </button>
            ) : null}
          </div>

          {showSkillInput ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                autoFocus
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSkill();
                  if (e.key === "Escape") {
                    setShowSkillInput(false);
                    setSkillDraft("");
                  }
                }}
                placeholder="Type a skill"
                className="field-input flex-1"
                aria-label="New skill"
              />
              <button type="button" onClick={commitSkill} className="rounded-btn bg-lime px-3 py-2 text-[11px] font-bold text-dark">
                Add
              </button>
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-medium text-faint">Suggestions:</span>
              {suggestions.map((s) => (
                <ChipButton key={s} label={s} onClick={() => toggleSkill(s)} />
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[13px] font-bold tracking-tight text-ink">Evidence</h2>
            {canAttach ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-[10px] font-semibold text-muted underline">
                  File
                </button>
                <button type="button" onClick={() => imageRef.current?.click()} className="flex items-center gap-1 text-[10px] font-semibold text-muted underline">
                  Image
                </button>
                <button type="button" onClick={() => setShowUrlInput((v) => !v)} className="flex items-center gap-1 text-[10px] font-semibold text-muted underline">
                  <Link2 className="h-3 w-3" /> URL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEvidenceGate(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-lime-deep hover:text-ink"
              >
                <ProBadge /> Pro feature
              </button>
            )}
          </div>

          {canAttach ? (
            <>
              <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) addFileLike(f, "file"); e.target.value = ""; }} />
              <input ref={imageRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) addFileLike(f, "image"); e.target.value = ""; }} />
            </>
          ) : null}

          {canAttach && showUrlInput ? (
            <div className="mb-2 flex items-center gap-2">
              <input
                autoFocus
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addUrl(); }}
                placeholder="https://…"
                className="field-input flex-1"
                aria-label="Evidence URL"
              />
              <button type="button" onClick={addUrl} className="rounded-btn bg-lime px-3 py-2 text-[11px] font-bold text-dark">
                Add
              </button>
            </div>
          ) : null}

          {evidence.length === 0 ? (
            <button
              type="button"
              onClick={() => { if (!canAttach) setEvidenceGate(true); }}
              className={`w-full rounded-xl border border-dashed border-dash px-3.5 py-3 text-center text-[10px] text-muted ${canAttach ? "cursor-default" : "hover:border-lime-deep"}`}
            >
              {canAttach
                ? "Attach a file, image or link to back up this win."
                : "Attachments are Pro. The onWard still saves without one."}
            </button>
          ) : (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="card flex items-center gap-3 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                    {kindIcon(ev.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-ink">{ev.label}</span>
                    <span className="block truncate text-[10px] text-muted">{ev.meta}</span>
                  </span>
                  <button type="button" aria-label={`Remove ${ev.label}`} onClick={() => removeEvidence(ev.id)} className="text-muted hover:text-ink">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {canAttach ? (
            <p className="mt-1.5 text-[9px] leading-[1.5] text-muted">
              Only attach work you have permission to share. Remove confidential details before adding it to your portfolio.
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-ink">Include in my portfolio</span>
            <Toggle checked={inPortfolio} onChange={setInPortfolio} label="Include in my portfolio" />
          </div>
          <p className="mt-1.5 text-[9px] text-muted">
            The portfolio file is only ever something you download and send. To show this win to other people, write a post about it from its own page.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={save} iconLeft={ward ? <Check className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}>
          {ward ? "Save changes" : "Save this onWard"}
        </Button>
      </div>
      <p className="mt-3 text-center text-[9px] text-faint">
        {canSave ? "Saved to your journal. Nothing is published yet." : "Add a title and the result to save."}
      </p>

      <UpgradeModal
        open={wardGate}
        onClose={() => setWardGate(false)}
        feature="Unlimited onWards"
        blurb={`You've logged ${wardsThisMonth} of ${limits.wardsPerMonth} free onWards this month. Pro removes the monthly cap so every win gets captured.`}
      />
      <UpgradeModal
        open={evidenceGate}
        onClose={() => setEvidenceGate(false)}
        feature="Attachments and evidence"
        blurb="Files, screenshots and links are a Pro feature. Free onWards still capture the title, the result, your skills and the portfolio toggle - nothing is lost by saving now."
      />
    </PhoneShell>
  );
}

function ChipButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-dash px-2.5 py-1 text-[10px] font-medium text-inksoft transition hover:border-lime-deep hover:bg-lime-pale"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}

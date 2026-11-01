"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { ChecklistEditor } from "@/components/checklist-editor";
import { DictateButton } from "@/components/dictate-button";
import { BackLink, Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useStore } from "@/components/store";
import { appendDictation } from "@/lib/dictation";
import {
  CHECKLIST_PREFIX,
  INDENT_PX,
  asChecklist,
  asProse,
  hasChecklist,
  noteToBody,
  parseNote,
  progress,
  toggleLine,
} from "@/lib/checklist";
import { haptic } from "@/lib/haptics";
import { formatStamp } from "@/lib/dates";
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  Link2,
  ListChecks,
  MoreHorizontal,
  Pin,
  Share2,
  Sprout,
  Trash2,
} from "lucide-react";

// Distance between the layout viewport and the visual viewport — the on-screen
// keyboard. zero when it is closed.
function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "note"
  );
}

type SocialTarget = {
  id: string;
  name: string;
  color: string;
  href: (text: string, url: string) => string;
};

const SOCIAL_TARGETS: SocialTarget[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    color: "#25D366",
    href: (t) => `https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`,
  },
  {
    id: "x",
    name: "X",
    color: "#141719",
    href: (t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    href: (_t, u) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    id: "telegram",
    name: "Telegram",
    color: "#229ED9",
    href: (t) => `https://t.me/share/url?url=${encodeURIComponent(t)}`,
  },
  {
    id: "email",
    name: "Email",
    color: "#5B6472",
    href: (t, u) =>
      `mailto:?subject=${encodeURIComponent(t.split("\n\n")[0] || "A note")}&body=${encodeURIComponent(`${t}\n\n${u}`)}`,
  },
];

function SocialGlyph({ id, color }: { id: string; color: string }) {
  const paths: Record<string, React.ReactNode> = {
    whatsapp: (
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01Zm-7.01 15.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    ),
    x: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    ),
    facebook: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    ),
    telegram: (
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.416-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 7.001-3.014 3.333-1.386 4.021-1.627 4.471-1.635Z" />
    ),
    email: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
        <path d="m3 6 9 7 9-7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };
  const isGlyph = id !== "email";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      style={isGlyph ? { fill: color } : undefined}
    >
      {paths[id]}
    </svg>
  );
}

async function robustCopy(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function NoteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notes, updateNote, deleteNote, togglePin, hydrated, settings } = useStore();
  const note = notes.find((n) => n.id === params.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [checklist, setChecklist] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const keyboardInset = useKeyboardInset();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Prose grows with the note instead of hiding the rest behind ten rows.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || !editing || checklist) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [body, editing, checklist]);

  const focusBody = () => {
    const first = listRef.current?.querySelector("textarea") as HTMLTextAreaElement | null;
    (checklist ? first : bodyRef.current)?.focus();
  };

  useEffect(() => {
    if (!note) return;
    const text = note.body ?? note.excerpt ?? "";
    setTitle(note.title);
    setBody(text);
    // A note nobody has written in yet starts as a list of tickable items.
    setChecklist(hasChecklist(text) || text.trim() === "");
  }, [note?.id, hydrated]);

  if (!note) {
    return (
      <PhoneShell>
        <div className="mb-4 flex items-center gap-1">
          <BackLink href="/notes" label="Back to notes" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Note</h1>
        </div>
        <p className="card px-4 py-6 text-center text-[12px] text-muted">This note no longer exists.</p>
        <div className="mt-4">
          <Button href="/notes">Back to notes</Button>
        </div>
      </PhoneShell>
    );
  }

  const savedTitle = note.title;
  const savedBody = note.body ?? note.excerpt ?? "";
  const dirty = title !== savedTitle || body !== savedBody;
  const done = progress(savedBody);
  // When it was first written down, not the relative "3d ago" the list uses.
  const addedAt = (note.createdAt && formatStamp(note.createdAt)) || note.when;

  const startEdit = () => setEditing(true);

  const save = () => {
    updateNote(note.id, {
      title: title.trim() || "Untitled note",
      body,
      excerpt: asProse(body).trim().slice(0, 120) || note.excerpt,
      when: "Edited just now",
    });
    setEditing(false);
  };

  // Ticking straight from the reading view, the way a subtask is ticked off.
  const tick = (index: number) => {
    const next = toggleLine(body, index);
    if (next === body) return;
    setBody(next);
    haptic("success", settings.haptics);
    updateNote(note.id, {
      body: next,
      excerpt: asProse(next).trim().slice(0, 120) || note.excerpt,
    });
  };

  const toggleChecklistMode = () => {
    if (checklist) {
      setChecklist(false);
      return;
    }
    setChecklist(true);
    setBody((value) => (value.trim() ? asChecklist(value) : CHECKLIST_PREFIX));
  };

  const discard = () => {
    setTitle(savedTitle);
    setBody(savedBody);
    setEditing(false);
  };

  const remove = () => {
    deleteNote(note.id);
    router.push("/notes");
  };

  // The one control that closes the note, keeping any edits on the way out.
  const doneAndLeave = () => {
    if (editing && dirty) save();
    router.push("/notes");
  };

  const exportMarkdown = () => {
    const md = `# ${title || "Untitled note"}\n\n${body}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const shareText = `${title}\n\n${asProse(body)}`.trim();
  const noteUrl = typeof window !== "undefined" ? window.location.href : "";

  const flashCopied = (kind: "text" | "link") => {
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  };

  const copyText = async () => {
    if (await robustCopy(shareText)) flashCopied("text");
  };

  const copyLink = async () => {
    if (await robustCopy(noteUrl)) flashCopied("link");
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: noteUrl });
        setShareOpen(false);
        return;
      } catch {
        /* user dismissed — keep the sheet open */
      }
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const openSocial = (target: SocialTarget) => {
    const url = target.href(shareText, noteUrl);
    if (target.id === "email") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setShareOpen(false);
  };

  return (
    <PhoneShell indicator={!editing}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href="/notes" label="Back to notes" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Note</h1>
          {editing && dirty ? (
            <span className="ml-1 flex items-center gap-1 text-[9px] font-semibold text-lime-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
              Unsaved
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={doneAndLeave}
            className="flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[12px] font-bold text-dark transition hover:bg-lime-deep active:scale-[0.98]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Done
          </button>
          <button
            type="button"
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            aria-pressed={note.pinned}
            onClick={() => togglePin(note.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              note.pinned ? "text-lime-deep" : "text-inksoft hover:bg-cream"
            }`}
          >
            <Pin className={`h-[18px] w-[18px] ${note.pinned ? "fill-lime-deep" : ""}`} />
          </button>
          <button
            type="button"
            aria-label="Share note"
            onClick={() => setShareOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Note options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {editing ? (
        <>
        <div className="lg:max-w-[760px]">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                focusBody();
              }
            }}
            aria-label="Note title"
            placeholder="Untitled note"
            className="w-full bg-transparent text-[27px] font-bold leading-[1.15] tracking-[-0.02em] text-ink outline-none placeholder:text-faint lg:text-[34px]"
          />
          <div className="mb-4 mt-2 flex items-center justify-between gap-2 lg:mb-5">
            <p className="text-[10px] font-medium text-muted lg:text-[11.5px]">
              {addedAt} · {body.length} characters
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleChecklistMode}
                aria-pressed={checklist}
                title="Enter starts a new item you can tick off"
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition ${
                  checklist ? "bg-lime text-dark" : "bg-cream text-inksoft hover:bg-line"
                }`}
              >
                <ListChecks className="h-3.5 w-3.5" strokeWidth={2.2} />
                Checklist
              </button>
              <DictateButton
                label="Dictate note"
                onText={(text) => setBody((value) => appendDictation(value, text))}
              />
            </div>
          </div>
          {checklist ? (
            <div ref={listRef}>
              <ChecklistEditor lines={parseNote(body)} onChange={(next) => setBody(noteToBody(next))} />
            </div>
          ) : (
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Note body"
              rows={8}
              placeholder="Start writing…"
              className="min-h-[220px] w-full resize-none bg-transparent text-[15px] leading-[1.75] text-inksoft outline-none [overflow-wrap:anywhere] placeholder:text-faint lg:min-h-[420px] lg:text-[16px] lg:leading-[1.8]"
            />
          )}
          <div className="h-32 lg:hidden" aria-hidden />
        </div>
        {/* Rides above the on-screen keyboard instead of hiding behind it. */}
        <div
          className="fixed inset-x-0 z-40 mx-auto w-full max-w-[400px] border-t border-line/70 bg-cream/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-[bottom] duration-150 md:max-w-[680px] lg:static lg:mx-0 lg:mt-6 lg:max-w-[760px] lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
          style={{ bottom: keyboardInset }}
        >
          <div className="flex gap-2">
            <Button onClick={save} iconLeft={<CheckCheck className="h-4 w-4" />} className="flex-1">
              Save note
            </Button>
            <Button variant="secondary" onClick={discard} className="flex-1">
              Discard
            </Button>
          </div>
        </div>
        </>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              startEdit();
            }
          }}
          className="cursor-text rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-lime/50 lg:max-w-[760px]"
        >
          <h2 className="text-[27px] font-bold leading-[1.15] tracking-[-0.02em] text-ink [overflow-wrap:anywhere] lg:text-[34px]">
            {note.title}
          </h2>
          <p className="mb-4 mt-2 text-[10px] font-medium text-muted lg:mb-6 lg:text-[11.5px]">
            Added {addedAt} · {savedBody.length} characters
            {done ? ` · ${done.done} of ${done.total} done` : ""}
          </p>
          {savedBody ? (
            <div className="-mx-2 space-y-0.5">
              {parseNote(savedBody).map((line, index) =>
                line.kind === "item" ? (
                  <button
                    key={index}
                    type="button"
                    aria-label={line.done ? `Mark "${line.text}" not done` : `Mark "${line.text}" done`}
                    aria-pressed={line.done}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      tick(index);
                    }}
                    className="group flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-cream"
                    style={{ paddingLeft: `${(line.depth ?? 0) * INDENT_PX + 8}px` }}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition ${
                        line.done
                          ? "border-lime-deep bg-lime"
                          : "border-dash bg-paper group-hover:border-lime-deep"
                      }`}
                    >
                      {line.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-[15px] leading-[1.6] [overflow-wrap:anywhere] lg:text-[16px] ${
                        line.done ? "text-faint line-through" : "text-inksoft"
                      }`}
                    >
                      {line.text || "Untitled item"}
                    </span>
                  </button>
                ) : (
                  <p
                    key={index}
                    className="whitespace-pre-line px-2 text-[15px] leading-[1.75] text-inksoft [overflow-wrap:anywhere] lg:text-[16px] lg:leading-[1.8]"
                    style={{ paddingLeft: `${(line.depth ?? 0) * INDENT_PX + 8}px` }}
                  >
                    {line.text}
                  </p>
                ),
              )}
            </div>
          ) : (
            <p className="text-[15px] italic text-faint lg:text-[16px]">Empty note — tap to write.</p>
          )}
          <p className="mt-6 flex items-center gap-1.5 text-[10px] font-semibold text-muted lg:text-[12px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tap the note to edit
          </p>
        </div>
      )}

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Note options">
        <div className="-mx-1 flex flex-col">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              router.push("/onwards/new");
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Sprout className="h-[18px] w-[18px] text-lime-deep" />
            <span className="text-[13px] font-semibold text-ink">Turn into an onWard</span>
          </button>
          <button
            type="button"
            onClick={exportMarkdown}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Download className="h-[18px] w-[18px] text-inksoft" />
            <span className="text-[13px] font-semibold text-ink">Export as Markdown</span>
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              remove();
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Trash2 className="h-[18px] w-[18px] text-[#E5484D]" />
            <span className="text-[13px] font-semibold text-[#E5484D]">Delete note</span>
          </button>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share note">
        <div className="-mx-1 flex flex-col">
          <button
            type="button"
            onClick={copyText}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
              <Copy className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">
                {copied === "text" ? "Copied to clipboard" : "Copy as text"}
              </span>
              <span className="block truncate text-[11px] text-muted">
                {title || "Untitled note"}
              </span>
            </span>
            {copied === "text" ? <CheckCheck className="h-4 w-4 text-lime-deep" /> : null}
          </button>

          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
              <Link2 className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">
                {copied === "link" ? "Link copied" : "Copy link"}
              </span>
              <span className="block truncate text-[11px] text-muted">{noteUrl}</span>
            </span>
            {copied === "link" ? <CheckCheck className="h-4 w-4 text-lime-deep" /> : null}
          </button>

          {canNativeShare ? (
            <button
              type="button"
              onClick={nativeShare}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                <Share2 className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">Share…</span>
                <span className="block text-[11px] text-muted">Send to another app</span>
              </span>
            </button>
          ) : null}

          <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Share to
          </p>
          <div className="flex items-start gap-2 px-1">
            {SOCIAL_TARGETS.map((target) => (
              <button
                key={target.id}
                type="button"
                aria-label={`Share to ${target.name}`}
                onClick={() => openSocial(target)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition hover:bg-cream"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream">
                  <SocialGlyph id={target.id} color={target.color} />
                </span>
                <span className="text-[10px] font-medium text-inksoft">{target.name}</span>
              </button>
            ))}
          </div>

          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              setShareOpen(false);
              exportMarkdown();
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
              <Download className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">Export as Markdown</span>
              <span className="block text-[11px] text-muted">Save a .md file</span>
            </span>
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}

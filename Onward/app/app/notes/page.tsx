"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { Chip, NewButton, PageHeader } from "@/components/ui";
import { useStore } from "@/components/store";
import { asProse, progress } from "@/lib/checklist";
import { dayHeading, formatReminderBrief, formatTimeOf, reminderPassed, toISO } from "@/lib/dates";
import type { Note } from "@/lib/data";
import { Bell, Clock, Pin, Search, X } from "lucide-react";

type Day = { key: string; heading: string; notes: Note[] };

/** The library is ordered by last edit, so a day's notes can be scattered. */
function groupByDay(notes: Note[]): Day[] {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    // Seed notes predate timestamps; they fall into one quiet "Earlier" group.
    const key = note.createdAt ? toISO(new Date(note.createdAt)) : "earlier";
    const bucket = groups.get(key);
    if (bucket) bucket.push(note);
    else groups.set(key, [note]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) =>
      a === b ? 0 : a === "earlier" ? 1 : b === "earlier" ? -1 : b.localeCompare(a),
    )
    .map(([key, dayNotes]) => ({
      key,
      heading: key === "earlier" ? "Earlier" : dayHeading(key),
      notes: dayNotes,
    }));
}

function NoteCard({ note, pale = false }: { note: Note; pale?: boolean }) {
  const list = progress(note.body ?? "");
  const time = note.createdAt ? formatTimeOf(note.createdAt) : note.when;
  // A note waiting on a nudge shows the nudge, not the hour it was written:
  // the day is already the group heading, and the reminder is the live thing.
  const late = Boolean(note.remindAt && reminderPassed(note.remindAt));
  const pill = note.remindAt ? formatReminderBrief(note.remindAt) : time;
  return (
    <Link
      href={`/notes/${note.id}`}
      className={`flex h-[164px] flex-col rounded-[22px] border px-4 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift lg:h-[196px] lg:px-5 lg:py-5 ${
        pale ? "border-lime-deep/40 bg-lime-pale" : "border-line bg-paper"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-[15px] font-bold tracking-tight text-ink [overflow-wrap:anywhere] lg:text-[17px]">
          {note.title}
        </h3>
        {pale ? <Pin className="h-4 w-4 shrink-0 fill-lime-deep text-lime-deep" /> : null}
      </div>
      <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[11.5px] leading-[1.65] text-inksoft lg:text-[13px]">
        {note.excerpt || asProse(note.body ?? "")}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
        <span className="text-[10.5px] font-semibold text-muted">
          {list ? `${list.done} of ${list.total} done` : ""}
        </span>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            late
              ? "bg-[#E5484D]/10 text-[#E5484D]"
              : note.remindAt
                ? "bg-lime-soft text-lime-deep"
                : "bg-ink text-paper"
          }`}
        >
          {note.remindAt ? (
            <Bell className="h-3 w-3" strokeWidth={2.4} />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {pill}
        </span>
      </div>
    </Link>
  );
}

function DaySection({ day }: { day: Day }) {
  return (
    <section className="mb-6 lg:mb-8">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
          {day.heading}
        </h2>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium text-faint">
          {day.notes.length} {day.notes.length === 1 ? "note" : "notes"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {day.notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}

export default function NotesPage() {
  const router = useRouter();
  const { notes, addNote } = useStore();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const tags = useMemo(() => Array.from(new Set(notes.map((n) => n.tag))), [notes]);
  const filters = ["All", ...tags];

  const q = query.trim().toLowerCase();
  const matches = (n: (typeof notes)[number]) => {
    if (filter !== "All" && n.tag !== filter) return false;
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.excerpt.toLowerCase().includes(q) ||
      (n.body ?? "").toLowerCase().includes(q)
    );
  };
  const shown = notes.filter(matches);
  const pinned = shown.filter((n) => n.pinned);
  const days = groupByDay(shown.filter((n) => !n.pinned));

  const countFor = (tag: string) =>
    tag === "All" ? notes.length : notes.filter((n) => n.tag === tag).length;

  const createNote = () => {
    const id = addNote({ tag: filter === "All" ? "Personal" : filter });
    router.push(`/notes/${id}`);
  };

  return (
    <PhoneShell tab="notes" wide>
      <PageHeader
        title="Your notes"
        subtitle="Room for ideas before they become something."
        actions={<NewButton onClick={createNote}>New note</NewButton>}
      />

      <div className="mb-5 grid gap-4 lg:mb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint lg:h-[18px] lg:w-[18px]" />
          <input
            className="field-input pl-9 pr-9 lg:h-11 lg:text-[14px]"
            placeholder="Search your thoughts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search your thoughts"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {filters.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "All" ? `All · ${countFor(f)}` : `${f} · ${countFor(f)}`}
            </Chip>
          ))}
        </div>
      </div>

      {pinned.length > 0 ? (
        <section className="mb-7 lg:mb-9">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
              Keep close
            </h2>
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-medium text-faint">{pinned.length} pinned</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pinned.map((note) => (
              <NoteCard key={note.id} note={note} pale />
            ))}
          </div>
        </section>
      ) : null}

      {days.length === 0 && pinned.length === 0 ? (
        <p className="card px-4 py-8 text-center text-[12px] text-muted lg:text-[14px]">
          {q ? `No notes match “${query.trim()}”.` : "No notes yet — capture the first thought."}
        </p>
      ) : (
        days.map((day) => <DaySection key={`${day.key}:${day.notes[0]?.id ?? ""}`} day={day} />)
      )}
    </PhoneShell>
  );
}

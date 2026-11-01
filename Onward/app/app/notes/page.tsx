"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { Chip, NewButton, PageHeader } from "@/components/ui";
import { useStore } from "@/components/store";
import { asProse } from "@/lib/checklist";
import { Pin, Search, X } from "lucide-react";

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
  const rest = shown.filter((n) => !n.pinned);

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

      <div className="mb-4 grid gap-4 lg:mb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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
        <section className="mb-6 lg:mb-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold tracking-tight text-ink lg:text-[18px]">
              Keep close
            </h2>
            <span className="text-[11px] font-semibold text-muted lg:text-[12px]">
              {pinned.length} pinned
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pinned.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex flex-col rounded-2xl border border-lime-deep/40 bg-lime-pale px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-card lg:px-5 lg:py-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-bold tracking-tight text-ink lg:text-[16px]">
                    {note.title}
                  </h3>
                  <Pin className="h-4 w-4 shrink-0 fill-lime-deep text-lime-deep" />
                </div>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-[1.6] text-inksoft lg:text-[12.5px]">
                  {note.excerpt || asProse(note.body ?? "")}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="tag bg-lime-soft">{note.tag}</span>
                  <span className="text-[10px] font-medium text-muted">{note.when}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[15px] font-bold tracking-tight text-ink lg:text-[18px]">
            {pinned.length > 0 ? "Recent thoughts" : "Your thoughts"}
          </h2>
          <span className="text-[11px] font-semibold text-muted lg:text-[12px]">
            {rest.length} notes
          </span>
        </div>
        {rest.length === 0 && pinned.length === 0 ? (
          <p className="card px-4 py-8 text-center text-[12px] text-muted lg:text-[14px]">
            {q ? `No notes match “${query.trim()}”.` : "No notes yet — capture the first thought."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="card flex flex-col px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-card lg:px-5 lg:py-4"
              >
                <h3 className="text-[14px] font-bold tracking-tight text-ink lg:text-[16px]">
                  {note.title}
                </h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-[1.6] text-muted lg:text-[12.5px]">
                  {note.excerpt || asProse(note.body ?? "")}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="tag">{note.tag}</span>
                  </span>
                  <span className="text-[10px] font-medium text-muted">{note.when}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PhoneShell>
  );
}

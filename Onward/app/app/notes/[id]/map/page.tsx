"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { MindMap, countBranches } from "@/components/mind-map";
import { BackLink } from "@/components/ui";
import { useStore } from "@/components/store";
import { asProse, noteToBody, parseNote } from "@/lib/checklist";
import { linesToTree, treeToLines, type MapNode } from "@/lib/mindmap";
import { Check } from "lucide-react";

export default function NoteMapPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notes, updateNote, hydrated } = useStore();
  const note = notes.find((n) => n.id === params.id);

  const savedBody = note?.body ?? note?.excerpt ?? "";
  const [tree, setTree] = useState<MapNode | null>(null);

  useEffect(() => {
    if (!note || !hydrated) return;
    setTree(linesToTree(note.title, parseNote(note.body ?? note.excerpt ?? "")));
    // Re-seeded only when the screen opens on a different note.
  }, [note?.id, hydrated]);

  const body = useMemo(() => (tree ? noteToBody(treeToLines(tree)) : ""), [tree]);
  const dirty = tree ? body !== savedBody : false;

  if (!note) {
    return (
      <PhoneShell>
        <div className="mb-4 flex items-center gap-1">
          <BackLink href="/notes" label="Back to notes" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Mind map</h1>
        </div>
        <p className="card px-4 py-6 text-center text-[12px] text-muted">This note no longer exists.</p>
      </PhoneShell>
    );
  }

  const done = () => {
    if (tree && dirty) {
      updateNote(note.id, {
        title: tree.text.trim() || "Untitled note",
        body,
        excerpt: asProse(body).trim().slice(0, 120) || note.excerpt,
        when: "Edited just now",
      });
    }
    router.push(`/notes/${note.id}`);
  };

  return (
    <PhoneShell indicator={false}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href={`/notes/${note.id}`} label="Back to note" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Mind map</h1>
          {dirty ? (
            <span className="ml-1 flex items-center gap-1 text-[9px] font-semibold text-lime-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
              Unsaved
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={done}
          className="flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-1.5 text-[12px] font-bold text-dark transition hover:bg-lime-deep active:scale-[0.98]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Done
        </button>
      </div>

      <p className="mb-4 text-[11px] leading-[1.5] text-muted lg:text-[12.5px]">
        Tap a bubble to rename it, the plus to grow a branch. This is the same note as the list —
        {tree ? ` ${countBranches(tree)} branches` : ""}, drawn sideways.
      </p>

      {tree ? (
        <MindMap root={tree} onChange={setTree} />
      ) : (
        <div className="card px-4 py-8 text-center text-[12px] text-muted">Loading the map…</div>
      )}

      {tree && !tree.children.length ? (
        <p className="mt-4 text-[11px] text-faint">
          The note is empty — use the plus under the title to add the first branch.
        </p>
      ) : null}
    </PhoneShell>
  );
}

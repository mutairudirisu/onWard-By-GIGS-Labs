"use client";

import { useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { addBranch, detach, layout, updateNode, type MapNode } from "@/lib/mindmap";

const ROW = 74;
const COL = 224;
const NODE_W = 176;
const PAD = 18;

/**
 * The outline drawn as branches. Editing here writes the same lines the
 * checklist editor shows, so the two views are two windows on one note.
 */
export function MindMap({
  root,
  onChange,
}: {
  root: MapNode;
  onChange: (next: MapNode) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const seed = useRef(0);
  const nextId = () => `m${++seed.current}`;

  const { placed, links, width, height } = layout(root, { row: ROW, col: COL, pad: PAD });

  const rename = (id: string, text: string) =>
    onChange(updateNode(root, id, (node) => ({ ...node, text })));

  const spawn = (parentId: string) => {
    const id = nextId();
    // Grown as a tickable item so the branch survives the trip back to the list.
    onChange(addBranch(root, parentId, { id, text: "", done: false, children: [] }));
    setActiveId(id);
  };

  const flip = (id: string) =>
    onChange(updateNode(root, id, (node) => ({ ...node, done: !node.done })));

  const remove = (id: string) => {
    onChange(detach(root, id));
    setActiveId(null);
  };

  return (
    <div className="-mx-5 overflow-x-auto rounded-2xl border border-line bg-cream/50 md:mx-0">
      <div className="relative" style={{ width, height: Math.max(height, ROW + PAD * 2) }}>
        <svg
          className="pointer-events-none absolute inset-0 text-dash"
          width={width}
          height={Math.max(height, ROW + PAD * 2)}
          aria-hidden
        >
          {links.map((link) => {
            const x1 = link.from.x + NODE_W;
            const x2 = link.to.x;
            const bend = (x2 - x1) / 2;
            return (
              <path
                key={`${link.from.node.id}-${link.to.node.id}`}
                d={`M ${x1} ${link.from.y} C ${x1 + bend} ${link.from.y}, ${x2 - bend} ${link.to.y}, ${x2} ${link.to.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {placed.map((spot) => {
          const { node } = spot;
          const isRoot = node.id === root.id;
          const active = activeId === node.id;
          return (
            <div
              key={node.id}
              className="absolute -translate-y-1/2"
              style={{ left: spot.x, top: spot.y, width: NODE_W }}
            >
              <div
                className={`rounded-xl border px-3 py-2 transition ${
                  isRoot
                    ? "border-ink bg-ink text-paper"
                    : active
                      ? "border-lime bg-paper shadow-lift"
                      : "border-line bg-paper"
                }`}
              >
                {active ? (
                  <input
                    autoFocus
                    value={node.text}
                    onChange={(e) => rename(node.id, e.target.value)}
                    onBlur={() => setActiveId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setActiveId(null);
                      }
                    }}
                    aria-label="Branch text"
                    placeholder="Enter text"
                    className="w-full bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:text-faint"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className={`block w-full text-left text-[13px] font-semibold leading-[1.35] ${
                      node.done ? "text-faint line-through" : "text-ink"
                    }`}
                  >
                    {node.text || (
                      <span className={isRoot ? "text-paper/60" : "text-faint"}>Untitled</span>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Add a branch to ${node.text || "this item"}`}
                  onClick={() => spawn(node.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                {node.done !== undefined ? (
                  <button
                    type="button"
                    aria-label={node.done ? `Mark "${node.text}" not done` : `Mark "${node.text}" done`}
                    aria-pressed={node.done}
                    onClick={() => flip(node.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded-[7px] border-2 transition ${
                      node.done ? "border-lime-deep bg-lime text-dark" : "border-dash bg-paper text-transparent"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                ) : null}
                {!isRoot ? (
                  <button
                    type="button"
                    aria-label={`Remove ${node.text || "this branch"}`}
                    onClick={() => remove(node.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-faint transition hover:bg-line hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A one-line summary so the map screen can say what it is looking at. */
export function countBranches(root: MapNode): number {
  return root.children.reduce((total, child) => total + 1 + countBranches(child), 0);
}

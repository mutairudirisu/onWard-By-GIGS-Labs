"use client";

import { useEffect, useRef, useState } from "react";
import { TaskRow } from "@/components/task-row";
import { useStore } from "@/components/store";
import type { Task } from "@/lib/data";
import { Archive, Trash2 } from "lucide-react";

const SWIPE_THRESHOLD = 82;

type Gesture = {
  id: string;
  startX: number;
  startY: number;
  baseY: number;
  dx: number;
  dy: number;
  mode: "pending" | "swipe" | "drag";
  timer: number | null;
};

type Ui = {
  id: string;
  mode: "swipe" | "drag";
  dx: number;
  dy: number;
  settling: boolean;
};

export function SortableTaskList({ tasks }: { tasks: Task[] }) {
  const { archiveTask, deleteTask, reorderTasks, settings } = useStore();

  const [ids, setIds] = useState<string[]>(() => tasks.map((t) => t.id));
  const idsRef = useRef<string[]>(ids);
  const commitIds = (next: string[]) => {
    idsRef.current = next;
    setIds(next);
  };

  const membership = tasks.map((t) => t.id).join("|");
  useEffect(() => {
    const incoming = tasks.map((t) => t.id);
    const kept = idsRef.current.filter((id) => incoming.includes(id));
    const added = incoming.filter((id) => !kept.includes(id));
    commitIds([...kept, ...added]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership]);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const ordered = ids.map((id) => byId.get(id)).filter((t): t is Task => Boolean(t));

  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  const g = useRef<Gesture | null>(null);
  const [ui, setUi] = useState<Ui | null>(null);
  const gestureActive = useRef(false);

  useEffect(() => () => {
    if (g.current?.timer) window.clearTimeout(g.current.timer);
  }, []);

  const handleDragMove = (clientY: number) => {
    const cur = g.current;
    if (!cur) return;
    const list = idsRef.current;
    const i = list.indexOf(cur.id);
    const el = rows.current[cur.id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;

    if (i < list.length - 1) {
      const nr = rows.current[list[i + 1]]?.getBoundingClientRect();
      if (nr && center > nr.top + nr.height / 2) {
        const next = list.slice();
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        commitIds(next);
        cur.baseY = clientY - (r.top - nr.top);
      }
    } else if (i > 0) {
      const pr = rows.current[list[i - 1]]?.getBoundingClientRect();
      if (pr && center < pr.top + pr.height / 2) {
        const next = list.slice();
        [next[i], next[i - 1]] = [next[i - 1], next[i]];
        commitIds(next);
        cur.baseY = clientY - (r.top - pr.top);
      }
    }
    cur.dy = clientY - cur.baseY;
  };

  const onPointerDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gestureActive.current = false;
    const target = e.currentTarget as HTMLElement;
    g.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      baseY: e.clientY,
      dx: 0,
      dy: 0,
      mode: "pending",
      timer: window.setTimeout(() => {
        const cur = g.current;
        if (!cur || cur.mode !== "pending") return;
        cur.mode = "drag";
        cur.baseY = cur.startY;
        gestureActive.current = true;
        if (settings.haptics) navigator.vibrate?.(10);
        setUi({ id, mode: "drag", dx: 0, dy: 0, settling: false });
      }, 380),
    };
    target.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur) return;
    const dx = e.clientX - cur.startX;
    const dy = e.clientY - cur.startY;

    if (cur.mode === "pending") {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        if (cur.timer) window.clearTimeout(cur.timer);
        cur.mode = "swipe";
        gestureActive.current = true;
      } else if (Math.abs(dy) > 12) {
        if (cur.timer) window.clearTimeout(cur.timer);
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        g.current = null;
        return;
      }
    }

    if (cur.mode === "swipe") {
      cur.dx = dx;
      setUi({ id: cur.id, mode: "swipe", dx, dy: 0, settling: false });
    } else if (cur.mode === "drag") {
      handleDragMove(e.clientY);
      setUi({ id: cur.id, mode: "drag", dx: 0, dy: cur.dy, settling: false });
    }
  };

  const finishAction = (id: string, kind: "archive" | "delete") => {
    const dx = kind === "archive" ? 460 : -460;
    setUi({ id, mode: "swipe", dx, dy: 0, settling: true });
    window.setTimeout(() => {
      if (kind === "archive") archiveTask(id);
      else deleteTask(id);
      setUi(null);
    }, 170);
  };

  const onPointerUp = () => {
    const cur = g.current;
    if (!cur) return;
    if (cur.timer) window.clearTimeout(cur.timer);
    const id = cur.id;

    if (cur.mode === "swipe") {
      if (cur.dx > SWIPE_THRESHOLD) finishAction(id, "archive");
      else if (cur.dx < -SWIPE_THRESHOLD) finishAction(id, "delete");
      else {
        setUi({ id, mode: "swipe", dx: 0, dy: 0, settling: true });
        window.setTimeout(() => setUi(null), 170);
      }
    } else if (cur.mode === "drag") {
      setUi({ id, mode: "drag", dx: 0, dy: 0, settling: true });
      reorderTasks(idsRef.current);
      window.setTimeout(() => setUi(null), 160);
    } else {
      setUi(null);
    }
    g.current = null;
  };

  if (ordered.length === 0) return null;

  return (
    <div className="space-y-2">
      {ordered.map((task) => {
        const active = ui?.id === task.id;
        const isDrag = active && ui.mode === "drag";
        const isSwipe = active && ui.mode === "swipe";
        const dx = active && isSwipe ? ui.dx : 0;
        const showArchive = dx > 6;
        const showDelete = dx < -6;

        return (
          <div
            key={task.id}
            ref={(el) => {
              rows.current[task.id] = el;
            }}
            className="relative select-none"
            style={{ touchAction: "pan-y", zIndex: isDrag ? 20 : undefined }}
            onClickCapture={(e) => {
              if (gestureActive.current) {
                e.preventDefault();
                e.stopPropagation();
                gestureActive.current = false;
              }
            }}
          >
            <div className="absolute inset-0 flex items-center justify-between overflow-hidden rounded-2xl">
              <span
                className={`flex items-center gap-2 pl-5 text-[12px] font-bold text-ink transition-opacity ${
                  showArchive ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-dark">
                  <Archive className="h-4 w-4" strokeWidth={2.4} />
                </span>
                Archive
              </span>
              <span
                className={`flex items-center gap-2 pr-5 text-[12px] font-bold text-white transition-opacity ${
                  showDelete ? "opacity-100" : "opacity-0"
                }`}
              >
                Delete
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5484D]">
                  <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                </span>
              </span>
            </div>

            <div
              onPointerDown={(e) => onPointerDown(task.id, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative z-10"
              style={{
                transform: `translate(${dx}px, ${isDrag && active ? ui.dy : 0}px)${
                  isDrag ? " scale(1.02)" : ""
                }`,
                transition: active && ui.settling ? "transform 170ms ease" : "none",
                boxShadow: isDrag ? "0 12px 28px rgba(16,17,8,0.18)" : undefined,
              }}
            >
              <TaskRow task={task} sub={task.meta} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

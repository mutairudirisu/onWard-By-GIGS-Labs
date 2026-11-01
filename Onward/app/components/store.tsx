"use client";

import {
  useCallback,
  useContext,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BASE_DATE,
  DEFAULT_SETTINGS,
  PLAN_LIMITS,
  type Note,
  type OnWard,
  type Plan,
  type PlanLimits,
  type Settings,
  type Task,
} from "@/lib/data";
import { formatMedium, wardDateLabel } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { setAllDone, stepProgress } from "@/lib/checklist";
import { toastError, toastSuccess } from "@/components/toast";
import { emitNotice } from "@/lib/notices";
import {
  deleteRow,
  fetchWorkspace,
  recordActivity,
  uuid,
  writeNote,
  writeOnWard,
  writeSettings,
  writeSkill,
  writeTask,
  type Workspace,
} from "@/lib/db";
import { useAuth } from "./auth";

type State = Workspace & {
  selectedDate: string;
  // Starred onWards. A device marker, not a server column: the workspace cache
  // below persists it, and it survives a reload but not a new device.
  favourites: string[];
};

// Per-account cache so two people on one device never share a first paint.
const CACHE_PREFIX = "onward.store.v3:";

function emptyState(): State {
  return {
    tasks: [],
    notes: [],
    onWards: [],
    skills: [],
    selectedDate: BASE_DATE,
    favourites: [],
    settings: { ...DEFAULT_SETTINGS },
    plan: "free",
  };
}

function readCache(userId: string): Partial<State> | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Partial<State>) : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, state: State) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

type NewTask = Partial<Omit<Task, "id" | "done">> & { title: string };
type NewNote = Partial<Omit<Note, "id">> & { title?: string };
type NewWard = {
  title: string;
  impact: string;
  body?: string;
  project?: string;
  skills: string[];
  evidence: NonNullable<OnWard["evidence"]>;
  inPortfolio: boolean;
  date?: string;
};

type Store = State & {
  hydrated: boolean;
  toggleTask: (id: string) => void;
  addTask: (data: NewTask) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  addNote: (data?: NewNote) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  addOnWard: (data: NewWard) => string;
  togglePortfolio: (id: string) => void;
  toggleFavourite: (id: string) => void;
  addSkill: (name: string) => void;
  setSelectedDate: (iso: string) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setPlan: (plan: Plan) => void;
  isPro: boolean;
  limits: PlanLimits;
  wardsThisMonth: number;
};

const StoreCtx = createContext<Store | null>(null);

/** What a server write reports back through the toast host. */
type Notice = { ok: string; fail: string };

// One pass over each collection turns a state change into the smallest set of
// row writes; position changes are writes too because tasks carry manual order.
async function sync(userId: string, prev: State, next: State) {
  const writes: Promise<unknown>[] = [];

  const prevTasks = new Map(prev.tasks.map((t, i) => [t.id, { row: t, index: i }]));
  const keptTasks = new Set(next.tasks.map((t) => t.id));
  prev.tasks
    .filter((t) => !keptTasks.has(t.id))
    .forEach((t) => writes.push(deleteRow("tasks", t.id)));
  next.tasks.forEach((task, index) => {
    const before = prevTasks.get(task.id);
    if (!before || before.row !== task || before.index !== index) {
      writes.push(writeTask(userId, task, index));
    }
  });

  const prevNotes = new Map(prev.notes.map((n) => [n.id, n]));
  const keptNotes = new Set(next.notes.map((n) => n.id));
  prev.notes
    .filter((n) => !keptNotes.has(n.id))
    .forEach((n) => writes.push(deleteRow("notes", n.id)));
  next.notes.forEach((note) => {
    if (prevNotes.get(note.id) !== note) writes.push(writeNote(userId, note));
  });

  const prevWards = new Map(prev.onWards.map((w) => [w.id, w]));
  const keptWards = new Set(next.onWards.map((w) => w.id));
  prev.onWards
    .filter((w) => !keptWards.has(w.id))
    .forEach((w) => writes.push(deleteRow("on_wards", w.id)));
  next.onWards.forEach((ward) => {
    if (prevWards.get(ward.id) !== ward) writes.push(writeOnWard(userId, ward));
  });

  next.skills
    .filter((name) => !prev.skills.includes(name))
    .forEach((name) => writes.push(writeSkill(userId, name)));

  if (next.settings !== prev.settings) writes.push(writeSettings(userId, next.settings));

  await Promise.all(writes);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async (id: string) => {
    try {
      const workspace = await fetchWorkspace(id);
      const next: State = {
        ...workspace,
        selectedDate: stateRef.current.selectedDate,
        favourites: stateRef.current.favourites,
      };
      stateRef.current = next;
      setState(next);
    } catch {
      /* keep the cached view; the next mutation or reload retries */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    setHydrated(false);
    if (!userId) {
      stateRef.current = emptyState();
      setState(stateRef.current);
      setHydrated(true);
      return;
    }
    const cached = readCache(userId);
    if (cached) {
      stateRef.current = { ...emptyState(), ...cached, settings: { ...DEFAULT_SETTINGS, ...cached.settings } };
      setState(stateRef.current);
    }
    void load(userId);
  }, [userId, load]);

  useEffect(() => {
    if (!userId || !hydrated) return;
    writeCache(userId, state);
  }, [state, hydrated, userId]);

  const commit = useCallback(
    (update: (prev: State) => State, notice?: Notice) => {
      const prev = stateRef.current;
      const next = update(prev);
      if (next === prev) return;
      stateRef.current = next;
      setState(next);
      if (!userId) return;
      void sync(userId, prev, next)
        .then(() => {
          if (notice) toastSuccess(notice.ok);
        })
        .catch(() => {
          // the server is the source of truth: pull it back rather than keep a
          // local edit that failed to land.
          if (notice) toastError(notice.fail);
          void load(userId);
        });
    },
    [userId, load],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const before = stateRef.current.tasks.find((t) => t.id === id);
      const nowDone = Boolean(before && !before.done);
      commit(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: nowDone,
                  // Ticking the task settles its steps, and vice versa.
                  steps: t.steps ? setAllDone(t.steps, nowDone) : t.steps,
                }
              : t,
          ),
        }),
        {
          ok: nowDone ? "Task done" : "Task reopened",
          fail: "Couldn't update the task",
        },
      );
      const hapticsOn = stateRef.current.settings.haptics;
      haptic(nowDone ? "success" : "tap", hapticsOn);
      if (userId && before && !before.done) {
        emitNotice({
          kind: "task",
          title: "Task complete",
          body: before.title,
          href: `/tasks/${id}`,
        });
        void recordActivity("task").catch(() => {
          /* activity is a nice-to-have; never block the task write */
        });
      }
    },
    [commit, userId],
  );

  const addTask = useCallback(
    (data: NewTask) => {
      const id = uuid();
      commit(
        (s) => ({
          ...s,
          tasks: [
            {
              id,
              title: data.title,
              meta: data.meta ?? "Personal",
              todaySub: data.todaySub ?? data.list ?? "Personal",
              time: data.time,
              notes: data.notes,
              steps: data.steps,
              dueDate: data.dueDate ?? formatMedium(s.selectedDate),
              list: data.list ?? "Personal",
              priority: data.priority ?? "Medium",
              done: false,
              date: data.date ?? s.selectedDate,
            },
            ...s.tasks,
          ],
        }),
        { ok: "Task added", fail: "Couldn't add the task" },
      );
      haptic("tap", stateRef.current.settings.haptics);
      return id;
    },
    [commit],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) =>
      commit(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const merged = { ...t, ...patch };
            if (patch.steps === undefined || patch.done !== undefined) return merged;
            // Steps decide the tick unless the caller set it deliberately.
            const steps = stepProgress(merged.steps);
            return { ...merged, done: steps ? steps.done === steps.total : merged.done };
          }),
        }),
        { ok: "Task updated", fail: "Couldn't update the task" },
      ),
    [commit],
  );

  const deleteTask = useCallback(
    (id: string) =>
      commit((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }), {
        ok: "Task deleted",
        fail: "Couldn't delete the task",
      }),
    [commit],
  );

  const archiveTask = useCallback(
    (id: string) =>
      commit(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, archived: true } : t)),
        }),
        { ok: "Task archived", fail: "Couldn't archive the task" },
      ),
    [commit],
  );

  const restoreTask = useCallback(
    (id: string) =>
      commit(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, archived: false } : t)),
        }),
        { ok: "Task restored", fail: "Couldn't restore the task" },
      ),
    [commit],
  );

  const reorderTasks = useCallback(
    (orderedIds: string[]) =>
      commit((s) => {
        const indexById = new Map(s.tasks.map((t, i) => [t.id, i]));
        const slots = orderedIds
          .map((id) => indexById.get(id))
          .filter((i): i is number => i != null)
          .sort((a, b) => a - b);
        const moved = orderedIds
          .map((id) => s.tasks.find((t) => t.id === id))
          .filter((t): t is Task => t != null);
        if (slots.length !== moved.length) return s;
        const next = s.tasks.slice();
        slots.forEach((slot, i) => {
          next[slot] = moved[i];
        });
        return { ...s, tasks: next };
      }),
    [commit],
  );

  const addNote = useCallback(
    (data: NewNote = {}) => {
      const id = uuid();
      commit(
        (s) => ({
          ...s,
          notes: [
            {
              id,
              title: data.title?.trim() || "Untitled note",
              excerpt: data.excerpt ?? "",
              body: data.body ?? "",
              tag: data.tag ?? "Personal",
              when: "Just now",
              createdAt: new Date().toISOString(),
              pinned: false,
              priority: data.priority ?? "Medium",
            },
            ...s.notes,
          ],
        }),
        { ok: "Note created", fail: "Couldn't create the note" },
      );
      haptic("tap", stateRef.current.settings.haptics);
      if (userId) {
        void recordActivity("note").catch(() => {
          /* activity is a nice-to-have; never block the note write */
        });
      }
      return id;
    },
    [commit, userId],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>) =>
      commit(
        (s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        }),
        { ok: "Note saved", fail: "Couldn't save the note" },
      ),
    [commit],
  );

  const deleteNote = useCallback(
    (id: string) =>
      commit((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }), {
        ok: "Note deleted",
        fail: "Couldn't delete the note",
      }),
    [commit],
  );

  const togglePin = useCallback(
    (id: string) => {
      const before = stateRef.current.notes.find((n) => n.id === id);
      commit(
        (s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        }),
        {
          ok: before?.pinned ? "Unpinned" : "Pinned to the top",
          fail: "Couldn't update the pin",
        },
      );
    },
    [commit],
  );

  const addOnWard = useCallback(
    (data: NewWard) => {
      const id = uuid();
      const date = data.date ?? BASE_DATE;
      commit(
        (s) => ({
          ...s,
          onWards: [
            {
              id,
              date,
              dateLabel: wardDateLabel(date),
              title: data.title,
              impact: data.impact,
              body: data.body,
              project: data.project,
              skills: data.skills,
              evidence: data.evidence,
              files: data.evidence.length,
              inPortfolio: data.inPortfolio,
            },
            ...s.onWards,
          ],
          skills: [
            ...new Set([
              ...s.skills,
              ...data.skills.filter((x) => !s.skills.includes(x)),
            ]),
          ],
        }),
        { ok: "onWard captured", fail: "Couldn't save the onWard" },
      );
      haptic("success", stateRef.current.settings.haptics);
      emitNotice({
        kind: "win",
        title: "onWard captured",
        body: data.title,
        href: `/onwards/${id}`,
      });
      if (userId) {
        void recordActivity("ward", date).catch(() => {
          /* activity is a nice-to-have; never block the ward write */
        });
      }
      return id;
    },
    [commit, userId],
  );

  const togglePortfolio = useCallback(
    (id: string) => {
      const before = stateRef.current.onWards.find((w) => w.id === id);
      commit(
        (s) => ({
          ...s,
          onWards: s.onWards.map((w) =>
            w.id === id ? { ...w, inPortfolio: !w.inPortfolio } : w,
          ),
        }),
        {
          ok: before?.inPortfolio ? "Removed from portfolio" : "Added to your portfolio",
          fail: "Couldn't update the portfolio",
        },
      );
    },
    [commit],
  );

  const toggleFavourite = useCallback(
    (id: string) =>
      commit((s) => ({
        ...s,
        favourites: s.favourites.includes(id)
          ? s.favourites.filter((f) => f !== id)
          : [...s.favourites, id],
      })),
    [commit],
  );

  const addSkill = useCallback(
    (name: string) =>
      commit(
        (s) => ({
          ...s,
          skills: s.skills.includes(name) ? s.skills : [...s.skills, name],
        }),
        { ok: "Skill added", fail: "Couldn't add the skill" },
      ),
    [commit],
  );

  const setSelectedDate = useCallback(
    (iso: string) => commit((s) => ({ ...s, selectedDate: iso })),
    [commit],
  );

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      commit((s) => ({ ...s, settings: { ...s.settings, [key]: value } }), {
        ok: "Preference saved",
        fail: "Couldn't save the preference",
      }),
    [commit],
  );

  // Billing state: the client has no UPDATE grant on profiles.plan, so this only
  // moves the local view until a payment webhook writes it server side.
  const setPlan = useCallback(
    (plan: Plan) => commit((s) => ({ ...s, plan })),
    [commit],
  );

  const monthKey = state.selectedDate.slice(0, 7);
  const wardsThisMonth = state.onWards.filter((w) =>
    (w.date ?? "").slice(0, 7) === monthKey,
  ).length;

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      archiveTask,
      restoreTask,
      reorderTasks,
      addNote,
      updateNote,
      deleteNote,
      togglePin,
      addOnWard,
      togglePortfolio,
      toggleFavourite,
      addSkill,
      setSelectedDate,
      setSetting,
      setPlan,
      isPro: state.plan === "pro",
      limits: PLAN_LIMITS[state.plan],
      wardsThisMonth,
    }),
    [
      state,
      hydrated,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      archiveTask,
      restoreTask,
      reorderTasks,
      addNote,
      updateNote,
      deleteNote,
      togglePin,
      addOnWard,
      togglePortfolio,
      toggleFavourite,
      addSkill,
      setSelectedDate,
      setSetting,
      setPlan,
      wardsThisMonth,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

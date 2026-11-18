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
  DEFAULT_SETTINGS,
  PLAN_LIMITS,
  type OnWard,
  type Plan,
  type PlanLimits,
  type Settings,
} from "@/lib/data";
import { todayISO, wardDateLabel } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { toastError, toastSuccess } from "@/components/toast";
import { emitNotice } from "@/lib/notices";
import {
  deleteRow,
  fetchWorkspace,
  recordActivity,
  uuid,
  writeOnWard,
  writeSettings,
  writeSkill,
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
const CACHE_PREFIX = "onward.store.v4:";

function emptyState(): State {
  return {
    onWards: [],
    skills: [],
    selectedDate: todayISO(),
    favourites: [],
    settings: { ...DEFAULT_SETTINGS },
    plan: "free",
    evidenceWardsUsed: 0,
    evidenceEntitlementWardIds: [],
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
  addOnWard: (data: NewWard) => string;
  updateOnWard: (id: string, data: NewWard) => void;
  deleteOnWard: (id: string) => Promise<boolean>;
  togglePortfolio: (id: string) => void;
  toggleFavourite: (id: string) => void;
  addSkill: (name: string) => void;
  setSelectedDate: (iso: string) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setPlan: (plan: Plan) => void;
  isPro: boolean;
  limits: PlanLimits;
  wardsThisMonth: number;
  evidenceWardsUsed: number;
};

const StoreCtx = createContext<Store | null>(null);

/**
 * What a server write reports back through the toast host. A write with no `ok`
 * still lands, it just stays quiet — not every save deserves a toast.
 */
export type Notice = { ok?: string; fail: string };

// One pass over the collection turns a state change into the smallest set of row writes.
async function sync(userId: string, prev: State, next: State) {
  const writes: Promise<unknown>[] = [];

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
      stateRef.current = {
        ...emptyState(),
        ...cached,
        // Yesterday's page should not be what you land on today.
        selectedDate: cached.selectedDate === todayISO() ? cached.selectedDate : todayISO(),
        settings: { ...DEFAULT_SETTINGS, ...cached.settings },
        evidenceWardsUsed:
          cached.evidenceWardsUsed ??
          cached.onWards?.filter((ward) => (ward.evidence?.length ?? 0) > 0).length ??
          0,
        evidenceEntitlementWardIds:
          cached.evidenceEntitlementWardIds ??
          cached.onWards?.filter((ward) => (ward.evidence?.length ?? 0) > 0).map((ward) => ward.id) ??
          [],
      };
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
          if (notice?.ok) toastSuccess(notice.ok);
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

  const addOnWard = useCallback(
    (data: NewWard) => {
      const id = uuid();
      const date = data.date ?? todayISO();
      commit(
        (s) => ({
          ...s,
          evidenceWardsUsed:
            s.evidenceWardsUsed + (data.evidence.length > 0 ? 1 : 0),
          evidenceEntitlementWardIds:
            data.evidence.length > 0
              ? [...new Set([...s.evidenceEntitlementWardIds, id])]
              : s.evidenceEntitlementWardIds,
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
        void recordActivity(date).catch(() => {
          /* activity is a nice-to-have; never block the ward write */
        });
      }
      return id;
    },
    [commit, userId],
  );

  // Same row, new contents: sync() sees a different object and upserts it, so an
  // edit never needs its own write path.
  const updateOnWard = useCallback(
    (id: string, data: NewWard) => {
      const date = data.date ?? todayISO();
      commit(
        (s) => ({
          ...s,
          evidenceWardsUsed:
            s.evidenceWardsUsed +
            (data.evidence.length > 0 &&
            !s.evidenceEntitlementWardIds.includes(id)
              ? 1
              : 0),
          evidenceEntitlementWardIds:
            data.evidence.length > 0
              ? [...new Set([...s.evidenceEntitlementWardIds, id])]
              : s.evidenceEntitlementWardIds,
          onWards: s.onWards.map((w) =>
            w.id === id
              ? {
                  ...w,
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
                }
              : w,
          ),
          skills: [
            ...new Set([
              ...s.skills,
              ...data.skills.filter((x) => !s.skills.includes(x)),
            ]),
          ],
        }),
        { ok: "onWard updated", fail: "Couldn't save the changes" },
      );
      haptic("success", stateRef.current.settings.haptics);
    },
    [commit],
  );

  const deleteOnWard = useCallback(
    async (id: string) => {
      if (!stateRef.current.onWards.some((ward) => ward.id === id)) return false;

      try {
        await deleteRow("on_wards", id);
      } catch (error) {
        toastError(error instanceof Error ? error.message : "Couldn't delete that onWard.");
        return false;
      }

      const current = stateRef.current;
      const hadEvidenceEntitlement = current.evidenceEntitlementWardIds.includes(id);
      const next: State = {
        ...current,
        onWards: current.onWards.filter((ward) => ward.id !== id),
        favourites: current.favourites.filter((favourite) => favourite !== id),
        evidenceWardsUsed: Math.max(
          0,
          current.evidenceWardsUsed - (hadEvidenceEntitlement ? 1 : 0),
        ),
        evidenceEntitlementWardIds: current.evidenceEntitlementWardIds.filter(
          (wardId) => wardId !== id,
        ),
      };
      stateRef.current = next;
      setState(next);
      toastSuccess("onWard deleted");
      return true;
    },
    [],
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

  // The Free allowance is a calendar-month count, so paging the date strip must
  // not change how many captures you have left.
  const monthKey = todayISO().slice(0, 7);
  const wardsThisMonth = state.onWards.filter((w) =>
    (w.date ?? "").slice(0, 7) === monthKey,
  ).length;
  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      addOnWard,
      updateOnWard,
      deleteOnWard,
      togglePortfolio,
      toggleFavourite,
      addSkill,
      setSelectedDate,
      setSetting,
      setPlan,
      isPro: state.plan === "pro",
      limits: PLAN_LIMITS[state.plan],
      wardsThisMonth,
      evidenceWardsUsed: state.evidenceWardsUsed,
    }),
    [
      state,
      hydrated,
      addOnWard,
      updateOnWard,
      deleteOnWard,
      togglePortfolio,
      toggleFavourite,
      addSkill,
      setSelectedDate,
      setSetting,
      setPlan,
      wardsThisMonth,
      state.evidenceWardsUsed,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

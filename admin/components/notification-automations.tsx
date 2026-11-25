"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Clock3, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import {
  fetchAdminPushAutomations,
  updateAdminPushAutomation,
  type AdminPushAutomation,
} from "@/lib/admin-api";

const DETAILS: Record<AdminPushAutomation["id"], { name: string; rule: string }> = {
  monday_motivation: {
    name: "Monday motivation",
    rule: "Monday · reaches people active in the last two days.",
  },
  daily_checkin: {
    name: "Usage check-in",
    rule: "Daily · only if they were recently active but have not logged anything today.",
  },
  friday_reflection: {
    name: "Friday weekly reflection",
    rule: "Friday · only if they were active this week and have not logged an onWard.",
  },
  long_absence: {
    name: "Gentle return",
    rule: "Daily check · one message after three quiet days, until they return.",
  },
};

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        enabled ? "bg-lime-deep" : "bg-dash"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
          enabled ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationAutomations() {
  const [automations, setAutomations] = useState<AdminPushAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAutomations(await fetchAdminPushAutomations());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load notification schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft(id: AdminPushAutomation["id"], values: Partial<AdminPushAutomation>) {
    setAutomations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...values } : item)),
    );
  }

  async function save(item: AdminPushAutomation) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await updateAdminPushAutomation(item);
      setNotice(`${DETAILS[item.id].name} schedule saved.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this schedule.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="panel flex items-center justify-center gap-2 px-6 py-20 text-[12.5px] font-semibold text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading notification schedules…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-soft text-lime-deep">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="h2">A useful cadence, not a notification flood</h2>
          <p className="sub mt-1.5">
            Schedules use Africa/Lagos time. Messages go only to users with push enabled and an
            active device subscription. Quiet hours are 20:00–08:00; automated broadcasts are capped
            at three per person in seven days and one per day.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="btn-ghost shrink-0">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </section>

      {error ? (
        <p role="alert" className="rounded-xl border border-bad/20 bg-[#FBEDEA] px-4 py-3 text-[12px] font-semibold text-bad">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl border border-good/20 bg-lime-soft px-4 py-3 text-[12px] font-semibold text-good">
          {notice}
        </p>
      ) : null}

      {automations.map((item) => (
        <section key={item.id} className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-inksoft">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="h2">{DETAILS[item.id].name}</h2>
                <span className={`badge ${item.enabled ? "bg-lime-soft text-good" : "bg-cream text-muted"}`}>
                  {item.enabled ? "Enabled" : "Paused"}
                </span>
              </div>
              <p className="tiny mt-1">{DETAILS[item.id].rule}</p>
            </div>
            <Toggle
              enabled={item.enabled}
              label={`${item.enabled ? "Pause" : "Enable"} ${DETAILS[item.id].name}`}
              onChange={() => updateDraft(item.id, { enabled: !item.enabled })}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor={`${item.id}-title`}>Notification title</label>
                <input
                  id={`${item.id}-title`}
                  className="field-input"
                  value={item.title}
                  maxLength={120}
                  onChange={(event) => updateDraft(item.id, { title: event.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor={`${item.id}-body`}>Message</label>
                <textarea
                  id={`${item.id}-body`}
                  className="field-input min-h-[78px] resize-y"
                  value={item.body}
                  maxLength={300}
                  onChange={(event) => updateDraft(item.id, { body: event.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`${item.id}-time`}>Send time · Lagos</label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                    <input
                      id={`${item.id}-time`}
                      type="time"
                      min="08:00"
                      max="19:59"
                      className="field-input pl-9"
                      value={item.local_time.slice(0, 5)}
                      onChange={(event) => updateDraft(item.id, { local_time: event.target.value })}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-canvas px-3.5 py-2.5">
                  <p className="label mb-1">Sent · last 7 days</p>
                  <p className="text-[15px] font-bold tabular-nums text-ink">
                    {item.sent_7d.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="tiny">
                {item.opted_in_users.toLocaleString()} users have push enabled. The audience rule
                narrows this number at send time.
              </p>
              <button
                type="button"
                disabled={
                  busyId === item.id ||
                  item.local_time < "08:00" ||
                  item.local_time >= "20:00"
                }
                onClick={() => void save(item)}
                className="btn-primary mt-auto self-end"
              >
                {busyId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {busyId === item.id ? "Saving…" : "Save schedule"}
              </button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Loader2, Megaphone, RefreshCw, Sprout, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui";
import { fetchAdminOverview, type AdminOverview } from "@/lib/admin-api";
import { broadcasts } from "@/lib/data";

function relative(value: string) {
  const then = Date.parse(value);
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function dayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { weekday: "short" });
}

function percent(part: number, total: number) {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";
}

const FALLBACK: AdminOverview = {
  totalUsers: 0,
  active7d: 0,
  new7d: 0,
  paid: 0,
  onWards: 0,
  tasks: 0,
  notes: 0,
  dau: [],
  recent: [],
};

export default function Overview() {
  const [data, setData] = useState<AdminOverview>(FALLBACK);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      setData(await fetchAdminOverview());
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the overview.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dau = data.dau;
  const maxDau = Math.max(1, ...dau.map((d) => d.value));
  const freeCount = Math.max(0, data.totalUsers - data.paid);
  const planSplit = [
    { plan: "Free", count: freeCount, color: "#C9CABC" },
    { plan: "Pro", count: data.paid, color: "#B4E13A" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Live numbers from the onWard database."
        actions={
          <>
            <button type="button" onClick={() => void load()} className="btn-ghost">
              <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} strokeWidth={2.1} />
              Refresh
            </button>
            <Link href="/broadcasts/new" className="btn-lime">
              <Megaphone className="h-4 w-4" strokeWidth={2.1} />
              New broadcast
            </Link>
          </>
        }
      />

      {state === "error" ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6E0DC] text-bad">
            <AlertCircle className="h-5 w-5" />
          </span>
          <p className="text-[13px] font-semibold text-ink">Could not load the overview</p>
          <p className="tiny max-w-md">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-ghost mt-1">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : state === "loading" ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-24 text-[12.5px] font-semibold text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading live metrics…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total users"
                value={data.totalUsers.toLocaleString()}
                hint={`+${data.new7d} this week`}
              />
              <StatCard
                label="Active · 7d"
                value={data.active7d.toLocaleString()}
                hint={data.totalUsers ? `${percent(data.active7d, data.totalUsers)} of base` : "No activity yet"}
              />
              <StatCard
                label="Pro members"
                value={data.paid.toLocaleString()}
                hint={data.totalUsers ? `${percent(data.paid, data.totalUsers)} of base` : "No upgrades yet"}
              />
              <StatCard
                label="onWards logged"
                value={data.onWards.toLocaleString()}
              />
            </div>

            <section className="panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="h2">Daily active users</h2>
                  <p className="tiny mt-0.5">Last 7 days · distinct people who logged something</p>
                </div>
                <span className="badge bg-lime-soft text-good">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> Live
                </span>
              </div>
              <div className="mt-6">
                {dau.length === 0 ? (
                  <p className="py-12 text-center text-[12.5px] text-muted">No activity recorded yet.</p>
                ) : (
                  <>
                    <div className="flex h-44 items-end gap-3 sm:gap-5">
                      {dau.map((d) => (
                        <div key={d.day} className="group relative flex-1" style={{ height: "100%" }}>
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-lg bg-lime/70 transition hover:bg-lime-deep"
                            style={{ height: `${(d.value / maxDau) * 100}%` }}
                          />
                          <span className="tiny absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-ink opacity-0 transition group-hover:opacity-100">
                            {d.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-3 sm:gap-5">
                      {dau.map((d) => (
                        <span key={d.day} className="flex-1 text-center text-[11px] font-semibold text-muted">
                          {dayLabel(d.day)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="panel p-6">
                <h2 className="h2">Plan mix</h2>
                <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-cream">
                  {planSplit.map((p) => (
                    <span
                      key={p.plan}
                      title={`${p.plan}: ${p.count.toLocaleString()}`}
                      style={{
                        width: data.totalUsers ? `${(p.count / data.totalUsers) * 100}%` : "0%",
                        background: p.color,
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-5 space-y-3">
                  {planSplit.map((p) => (
                    <li key={p.plan} className="flex items-center gap-3 text-[13px]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="font-semibold text-ink">{p.plan}</span>
                      <span className="ml-auto tabular-nums text-muted">
                        {p.count.toLocaleString()}
                      </span>
                      <span className="w-10 text-right tabular-nums text-faint">
                        {percent(p.count, data.totalUsers)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel p-6">
                <div className="flex items-center justify-between">
                  <h2 className="h2">Recent onWards</h2>
                  <Link href="/users" className="tiny inline-flex items-center gap-1 font-semibold text-lime-deep hover:text-ink">
                    See users <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {data.recent.length === 0 ? (
                  <p className="mt-6 text-[12.5px] text-muted">
                    Nothing logged yet. Activity appears here the moment someone saves an onWard.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.recent.slice(0, 4).map((r, i) => (
                      <li key={`${r.name}-${i}`} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                          <Sprout className="h-4 w-4" strokeWidth={2.1} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-ink">{r.title}</p>
                          <p className="tiny truncate">
                            {r.name} · {relative(r.when)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="panel p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
                <h2 className="h2">Live activity</h2>
              </div>
              {data.recent.length === 0 ? (
                <p className="mt-4 text-[12.5px] text-muted">Waiting for the first onWard.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {data.recent.map((r, i) => (
                    <li key={`${r.title}-${i}`} className="flex gap-3">
                      <span className="relative mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime-deep">
                        {i < data.recent.length - 1 ? (
                          <span className="absolute left-1/2 top-3 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-line" />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] leading-snug text-ink">
                          <span className="font-bold">{r.name}</span> logged {r.title}
                        </p>
                        <p className="tiny">{relative(r.when)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
                <h2 className="h2">Stored content</h2>
              </div>
              <dl className="mt-4 space-y-2.5">
                {[
                  { label: "onWards", value: data.onWards },
                  { label: "Tasks · legacy", value: data.tasks },
                  { label: "Notes · legacy", value: data.notes },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <dt className="text-[12.5px] text-muted">{row.label}</dt>
                    <dd className="text-[15px] font-bold tabular-nums tracking-tight text-ink">
                      {row.value.toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="h2">Recent broadcasts</h2>
                <Link href="/broadcasts" className="tiny inline-flex items-center gap-1 font-semibold text-lime-deep hover:text-ink">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {broadcasts.slice(0, 2).map((b) => (
                  <li key={b.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                      <Megaphone className="h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">{b.title}</p>
                      <p className="tiny truncate">{b.channel} · {b.when.split(" ")[0]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

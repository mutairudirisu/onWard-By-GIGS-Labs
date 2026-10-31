import Link from "next/link";
import { ArrowUpRight, Megaphone, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui";
import { activity, dauSeries, planSplit, stats, broadcasts } from "@/lib/data";

const max = Math.max(...dauSeries.map((d) => d.value));
const totalPlan = planSplit.reduce((s, p) => s + p.count, 0);

export default function Overview() {
  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="How onWard is growing, right now."
        actions={
          <>
            <Link href="/analytics" className="btn-ghost">
              <TrendingUp className="h-4 w-4" strokeWidth={2.1} />
              Reports
            </Link>
            <Link href="/broadcasts/new" className="btn-lime">
              <Megaphone className="h-4 w-4" strokeWidth={2.1} />
              New broadcast
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* main column */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} delta={{ value: "5.2%", up: true }} hint="+642 this week" />
            <StatCard label="Active · 7d" value={stats.active7d.toLocaleString()} delta={{ value: "3.1%", up: true }} hint="66% of base" />
            <StatCard label="Paid conversion" value={`${stats.paidConversion}%`} delta={{ value: "0.4%", up: false }} hint="Pro + Team" />
            <StatCard label="onWards logged" value={stats.onwardsLogged.toLocaleString()} delta={{ value: "12%", up: true }} hint="last 30 days" />
          </div>

          {/* DAU bar chart */}
          <section className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="h2">Daily active users</h2>
                <p className="tiny mt-0.5">Last 7 days</p>
              </div>
              <span className="badge bg-lime-soft text-good">▲ 18% vs last week</span>
            </div>
            <div className="mt-6">
              <div className="flex h-44 items-end gap-3 sm:gap-5">
                {dauSeries.map((d) => (
                  <div
                    key={d.day}
                    className="group relative flex-1 rounded-t-lg bg-lime/70 transition hover:bg-lime-deep"
                    style={{ height: `${(d.value / max) * 100}%` }}
                  >
                    <span className="tiny absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-ink opacity-0 transition group-hover:opacity-100">
                      {d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-3 sm:gap-5">
                {dauSeries.map((d) => (
                  <span key={d.day} className="flex-1 text-center text-[11px] font-semibold text-muted">
                    {d.day}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* plan split + recent broadcasts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="panel p-6">
              <h2 className="h2">Plan mix</h2>
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
                {planSplit.map((p) => (
                  <span
                    key={p.plan}
                    title={`${p.plan}: ${p.count.toLocaleString()}`}
                    style={{ width: `${(p.count / totalPlan) * 100}%`, background: p.color }}
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
                      {Math.round((p.count / totalPlan) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel p-6">
              <div className="flex items-center justify-between">
                <h2 className="h2">Recent broadcasts</h2>
                <Link href="/broadcasts" className="tiny inline-flex items-center gap-1 font-semibold text-lime-deep hover:text-ink">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {broadcasts.slice(0, 3).map((b) => (
                  <li key={b.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                      <Megaphone className="h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">{b.title}</p>
                      <p className="tiny truncate">
                        {b.channel} · {b.reach.toLocaleString()} reached · {Math.round((b.opened / b.reach) * 100)}% opened
                      </p>
                    </div>
                    <span className="tiny shrink-0">{b.when.split(" ")[0]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* right rail — activity */}
        <aside className="space-y-4">
          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
              <h2 className="h2">Live activity</h2>
            </div>
            <ul className="mt-4 space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="relative mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime-deep">
                    {i < activity.length - 1 ? (
                      <span className="absolute left-1/2 top-3 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-line" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug text-ink">
                      <span className="font-bold">{a.who}</span> {a.what}
                    </p>
                    <p className="tiny">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel bg-ink p-5 text-paper">
            <p className="eyebrow text-lime">Retention</p>
            <p className="mt-2 text-[28px] font-bold leading-none">{stats.retention}%</p>
            <p className="tiny mt-2 text-paper/60">
              Day-7 retention across the whole base. D30 sits at {stats.d30}%.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui";
import { dauSeries, planSplit, stats } from "@/lib/data";

const retention = [
  { label: "D1", value: 88 },
  { label: "D7", value: 71 },
  { label: "D14", value: 58 },
  { label: "D30", value: 44 },
  { label: "D60", value: 33 },
  { label: "D90", value: 27 },
];

const channels = [
  { label: "Push", reach: 68, opened: 41 },
  { label: "In-app", reach: 54, opened: 50 },
  { label: "Email", reach: 92, opened: 22 },
];

const roles = [
  { label: "Engineer", value: 3120 },
  { label: "Designer", value: 2410 },
  { label: "Operations", value: 1980 },
  { label: "Marketing", value: 1240 },
  { label: "Founder", value: 860 },
];

const maxRole = Math.max(...roles.map((r) => r.value));
const maxDau = Math.max(...dauSeries.map((d) => d.value));

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Insights", href: "/" }, { label: "Analytics" }]}
        title="Analytics"
        subtitle="Growth, retention and engagement across the base."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New this week" value={stats.newThisWeek.toLocaleString()} delta={{ value: "9%", up: true }} />
        <StatCard label="D7 retention" value={`${stats.retention}%`} delta={{ value: "2.4%", up: true }} />
        <StatCard label="D30 retention" value={`${stats.d30}%`} delta={{ value: "1.1%", up: false }} />
        <StatCard label="Avg streak" value="9.4" hint="days, active users" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="h2">Growth · daily actives</h2>
          <div className="mt-6">
            <div className="flex h-40 items-end gap-3">
              {dauSeries.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 rounded-t-lg bg-ink/85"
                  style={{ height: `${(d.value / maxDau) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-3">
              {dauSeries.map((d) => (
                <span key={d.day} className="flex-1 text-center text-[11px] font-semibold text-muted">
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="h2">Retention curve</h2>
          <div className="mt-5 space-y-3">
            {retention.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-8 text-[12px] font-bold text-ink">{r.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EDEDE4]">
                  <div className="h-full rounded-full bg-lime-deep" style={{ width: `${r.value}%` }} />
                </div>
                <span className="w-9 text-right text-[12px] tabular-nums text-muted">{r.value}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="h2">Broadcast channel performance</h2>
          <p className="tiny mt-0.5">Reach vs open rate, last 30 days</p>
          <div className="mt-5 space-y-4">
            {channels.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-ink">{c.label}</span>
                  <span className="text-muted">{c.opened}% open</span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EDEDE4]">
                    <div className="h-full rounded-full bg-ink/25" style={{ width: `${c.reach}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="h2">Top roles</h2>
          <div className="mt-5 space-y-3">
            {roles.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-20 truncate text-[12.5px] font-semibold text-ink">{r.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EDEDE4]">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${(r.value / maxRole) * 100}%` }} />
                </div>
                <span className="w-12 text-right text-[12px] tabular-nums text-muted">
                  {r.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="h2">Plan distribution</h2>
        <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full">
          {planSplit.map((p) => (
            <span key={p.plan} style={{ width: `${(p.count / stats.totalUsers) * 100}%`, background: p.color }} />
          ))}
        </div>
      </section>
    </>
  );
}

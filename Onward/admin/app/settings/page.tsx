"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Check, ShieldAlert } from "lucide-react";

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-lime-deep" : "bg-dash"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [flags, setFlags] = useState({
    weeklyDigest: true,
    churnAlerts: true,
    autoNudge: false,
    maintenance: false,
  });
  const set = (k: keyof typeof flags) => (v: boolean) =>
    setFlags((f) => ({ ...f, [k]: v }));

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Insights", href: "/" }, { label: "Settings" }]}
        title="Workspace settings"
        subtitle="Branding, notification defaults and admin access."
        actions={
          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="btn-lime"
          >
            {saved ? <Check className="h-4 w-4" strokeWidth={2.6} /> : null}
            {saved ? "Saved" : "Save changes"}
          </button>
        }
      />

      <div className="grid max-w-4xl grid-cols-1 gap-6">
        <section className="panel p-6">
          <h2 className="h2">General</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Workspace name</label>
              <input className="field-input" defaultValue="onWard" />
            </div>
            <div>
              <label className="label">Support email</label>
              <input className="field-input" defaultValue="team@onward.app" />
            </div>
            <div>
              <label className="label">Default plan</label>
              <select className="field-input">
                <option>Free</option>
                <option>Pro</option>
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="field-input" defaultValue="Africa/Lagos">
                <option>Africa/Lagos</option>
                <option>UTC</option>
                <option>Europe/London</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="h2">Notification defaults</h2>
          <div className="mt-4 divide-y divide-line/70">
            {[
              { k: "weeklyDigest", t: "Weekly digest", d: "Email admins a summary every Monday." },
              { k: "churnAlerts", t: "Churn alerts", d: "Ping when a paid account goes quiet for 14 days." },
              { k: "autoNudge", t: "Auto-nudge at-risk streaks", d: "Send a gentle push when a streak is about to break." },
              { k: "maintenance", t: "Maintenance mode", d: "Pause all outbound broadcasts and logins." },
            ].map((row) => (
              <div key={row.k} className="flex items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink">{row.t}</p>
                  <p className="tiny">{row.d}</p>
                </div>
                <Toggle
                  on={flags[row.k as keyof typeof flags]}
                  onChange={set(row.k as keyof typeof flags)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="h2">Admin team</h2>
          <ul className="mt-4 divide-y divide-line/70">
            {[
              { n: "Mutairu Dirisu", e: "mutairu@onward.app", r: "Owner" },
              { n: "Grace Etim", e: "grace@onward.app", r: "Admin" },
              { n: "Sam Lee", e: "sam@onward.app", r: "Analyst" },
            ].map((m) => (
              <li key={m.e} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
                  {m.n.split(" ").map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{m.n}</p>
                  <p className="tiny truncate">{m.e}</p>
                </div>
                <span className="chip">{m.r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-bad/30 bg-[#FBEDEA] p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-bad" strokeWidth={2.2} />
            <h2 className="h2 !text-bad">Danger zone</h2>
          </div>
          <p className="sub mt-1.5">
            Destructive actions are disabled in this preview workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-ghost !border-bad/30 !text-bad hover:!bg-[#F6E0DC]" disabled>
              Suspend workspace
            </button>
            <button className="btn-ghost !border-bad/30 !text-bad hover:!bg-[#F6E0DC]" disabled>
              Delete all data
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

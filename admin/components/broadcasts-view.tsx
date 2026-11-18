"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  Mail,
  Megaphone,
  MonitorSmartphone,
  Send,
  Clock,
} from "lucide-react";
import {
  broadcasts as seed,
  audienceLabels,
  stats,
  type Audience,
  type Broadcast,
  type Channel,
} from "@/lib/data";

const AUDIENCES: Audience[] = ["all", "active", "at-risk", "pro", "new"];
const CHANNELS: { id: Channel; label: string; Icon: typeof Bell }[] = [
  { id: "push", label: "Push", Icon: Bell },
  { id: "email", label: "Email", Icon: Mail },
  { id: "in-app", label: "In-app", Icon: MonitorSmartphone },
];

function reachFor(a: Audience) {
  return {
    all: stats.totalUsers,
    active: stats.active7d,
    "at-risk": 1840,
    pro: 3060,
    new: stats.newThisWeek,
    free: 9420,
  }[a];
}

const statusCls: Record<Broadcast["status"], string> = {
  sent: "bg-lime-soft text-good",
  scheduled: "bg-[#E7E2F5] text-[#6D5AA8]",
  draft: "bg-[#EFEFE6] text-inksoft",
};

export function BroadcastsView({ composeFirst = false }: { composeFirst?: boolean }) {
  const [list, setList] = useState<Broadcast[]>(seed);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("push");
  const [audience, setAudience] = useState<Audience>("all");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const reach = useMemo(() => reachFor(audience), [audience]);

  function send() {
    if (!title.trim() || !body.trim()) {
      setToast("Add a title and a message first.");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    const b: Broadcast = {
      id: `b_${Math.floor(Math.random() * 900 + 100)}`,
      title: title.trim(),
      body: body.trim(),
      channel,
      audience,
      status: when === "now" ? "sent" : "scheduled",
      when:
        when === "now"
          ? new Date().toISOString().slice(0, 16).replace("T", " ")
          : at || "Scheduled",
      reach,
      opened: when === "now" ? 0 : 0,
    };
    setList((l) => [b, ...l]);
    setTitle("");
    setBody("");
    setAt("");
    setToast(
      when === "now"
        ? `Sent “${b.title}” to ${reach.toLocaleString()} users.`
        : `Scheduled “${b.title}”.`,
    );
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className={`grid grid-cols-1 gap-6 ${composeFirst ? "" : "lg:grid-cols-[1fr_1fr]"}`}>
      {/* composer */}
      <section className="panel p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
          <h2 className="h2">Compose broadcast</h2>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday reset"
              maxLength={48}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="field-input min-h-[92px] resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Small win before the week starts? Log one onWard and keep your streak warm."
              maxLength={160}
            />
            <p className="tiny mt-1 text-right">{body.length}/160</p>
          </div>

          <div>
            <label className="label">Channel</label>
            <div className="flex gap-2">
              {CHANNELS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setChannel(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition ${
                    channel === id
                      ? "border-lime-deep bg-lime-pale text-ink"
                      : "border-line bg-paper text-inksoft hover:border-dash"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Audience</label>
              <select
                className="field-input"
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {audienceLabels[a]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">When</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWhen("now")}
                  className={`btn flex-1 !py-2.5 ${when === "now" ? "btn-lime" : "btn-ghost"}`}
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={2.2} /> Now
                </button>
                <button
                  onClick={() => setWhen("later")}
                  className={`btn flex-1 !py-2.5 ${when === "later" ? "btn-lime" : "btn-ghost"}`}
                >
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.2} /> Later
                </button>
              </div>
            </div>
          </div>

          {when === "later" ? (
            <div>
              <label className="label">Send at</label>
              <input
                type="datetime-local"
                className="field-input"
                value={at}
                onChange={(e) => setAt(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        {/* live preview */}
        <div className="mt-5 rounded-xl border border-dash bg-cream p-4">
          <p className="eyebrow mb-2">Preview · reaches {reach.toLocaleString()} users</p>
          <div className="flex items-start gap-3 rounded-xl bg-paper p-3 shadow-card">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-paper">
              <Megaphone className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">
                {title || "Your title"}
              </p>
              <p className="line-clamp-2 text-[12px] leading-snug text-inksoft">
                {body || "Your message preview shows up here."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="tiny">
            {when === "now" ? "Sends immediately" : "Queued for later"} ·{" "}
            {audienceLabels[audience]}
          </p>
          <button onClick={send} className="btn-primary">
            <Send className="h-4 w-4" strokeWidth={2.2} />
            {when === "now" ? "Send broadcast" : "Schedule"}
          </button>
        </div>
      </section>

      {/* history */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="h2">History</h2>
          <span className="tiny">{list.length} total</span>
        </div>
        <div className="scroll-thin max-h-[640px] divide-y divide-line/70 overflow-y-auto">
          {list.map((b) => (
            <div key={b.id} className="flex items-start gap-3 px-6 py-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                {b.channel === "email" ? (
                  <Mail className="h-4 w-4" strokeWidth={2.1} />
                ) : b.channel === "in-app" ? (
                  <MonitorSmartphone className="h-4 w-4" strokeWidth={2.1} />
                ) : (
                  <Bell className="h-4 w-4" strokeWidth={2.1} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-bold text-ink">{b.title}</p>
                  <span className={`badge ${statusCls[b.status]}`}>{b.status}</span>
                </div>
                <p className="tiny mt-0.5 truncate">{b.body}</p>
                <p className="tiny mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span>{b.when}</span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" strokeWidth={2.6} />
                    {b.reach.toLocaleString()} reached
                  </span>
                  {b.opened > 0 ? (
                    <span>{Math.round((b.opened / b.reach) * 100)}% opened</span>
                  ) : null}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper shadow-pop">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

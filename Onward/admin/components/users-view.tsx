"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Filter, Loader2, RefreshCw, Search } from "lucide-react";
import { Avatar, StatusBadge } from "@/components/ui";
import {
  fetchAdminUsers,
  usersToCsv,
  type AdminPlan,
  type AdminUser,
  type AdminUserStatus,
} from "@/lib/admin-api";

const PLANS: AdminPlan[] = ["Free", "Pro"];
const STATUSES: (AdminUserStatus | "all")[] = ["all", "active", "idle", "invited"];

export function UsersView() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminUserStatus | "all">("all");
  const [plan, setPlan] = useState<AdminPlan | "all">("all");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      setRows(await fetchAdminUsers());
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("q");
    if (fromUrl) setQ(fromUrl);
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      if (plan !== "all" && u.plan !== plan) return false;
      if (needle && !`${u.name} ${u.email} ${u.role} ${u.referralCode}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [rows, q, status, plan]);

  const download = () => {
    const blob = new Blob([usersToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `onward-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field-input !py-2 pl-9 text-[12.5px]"
            placeholder="Search name, email, role or invite code…"
            aria-label="Search users"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted" strokeWidth={2.1} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminUserStatus | "all")}
            aria-label="Filter by status"
            className="field-input !w-auto !py-2 text-[12.5px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Any status" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as AdminPlan | "all")}
            aria-label="Filter by plan"
            className="field-input !w-auto !py-2 text-[12.5px]"
          >
            <option value="all">Any plan</option>
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => void load()} className="btn-ghost !py-2" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} strokeWidth={2.1} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          type="button"
          onClick={download}
          disabled={filtered.length === 0}
          className="btn-lime !py-2 disabled:opacity-50"
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          Export CSV
        </button>
      </div>

      {state === "error" ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6E0DC] text-bad">
            <AlertCircle className="h-5 w-5" />
          </span>
          <p className="text-[13px] font-semibold text-ink">Could not load users</p>
          <p className="tiny max-w-md">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-ghost mt-1">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead className="border-b border-line bg-cream/60">
                <tr>
                  <th className="th">User</th>
                  <th className="th">Role</th>
                  <th className="th">Plan</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Streak</th>
                  <th className="th text-right">onWards</th>
                  <th className="th text-right">Active days</th>
                  <th className="th">Last active</th>
                  <th className="th">Joined</th>
                </tr>
              </thead>
              <tbody>
                {state === "loading" ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading real users from Supabase…
                      </span>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-line/70 transition last:border-0 hover:bg-cream/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size={34} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-ink">{u.name}</p>
                            <p className="tiny truncate">{u.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">{u.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            u.plan === "Pro" ? "bg-lime-soft text-good" : "bg-[#EFEFE6] text-inksoft"
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="td text-right tabular-nums">{u.streak}</td>
                      <td className="td text-right tabular-nums">{u.onwards}</td>
                      <td className="td text-right tabular-nums">{u.activeDays}</td>
                      <td className="td whitespace-nowrap">{u.lastActive}</td>
                      <td className="td whitespace-nowrap">{u.joined || "—"}</td>
                    </tr>
                  ))
                )}
                {state === "ready" && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <p className="text-[13px] font-semibold text-ink">
                        {rows.length === 0 ? "No accounts yet." : "No users match those filters."}
                      </p>
                      <p className="tiny mt-1">
                        {rows.length === 0
                          ? "As soon as people sign up in the app they will appear here."
                          : "Try clearing the search or status."}
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="tiny">
              Showing <span className="font-bold text-ink">{filtered.length}</span> of {rows.length}{" "}
              {rows.length === 1 ? "account" : "accounts"}
            </p>
            <p className="tiny">Live from Supabase</p>
          </div>
        </div>
      )}
    </div>
  );
}

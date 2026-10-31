"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Check,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Avatar, StatusBadge } from "@/components/ui";
import {
  users as seed,
  type AdminUser,
  type Plan,
  type UserStatus,
} from "@/lib/data";

const PLANS: Plan[] = ["Free", "Pro", "Team"];
const STATUSES: (UserStatus | "all")[] = ["all", "active", "invited", "suspended"];

export function UsersView() {
  const [rows, setRows] = useState<AdminUser[]>(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [plan, setPlan] = useState<Plan | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      if (plan !== "all" && u.plan !== plan) return false;
      if (
        needle &&
        !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [rows, q, status, plan]);

  const allChecked =
    filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(filtered.map((u) => u.id)));
  }

  function setStatusFor(ids: string[], next: UserStatus) {
    setRows((r) =>
      r.map((u) => (ids.includes(u.id) ? { ...u, status: next } : u)),
    );
    setSelected(new Set());
  }

  function remove(ids: string[]) {
    setRows((r) => r.filter((u) => !ids.includes(u.id)));
    setSelected(new Set());
  }

  function addUser(u: AdminUser) {
    setRows((r) => [u, ...r]);
    setAdding(false);
  }

  const sel = [...selected];

  return (
    <div>
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field-input !py-2 pl-9 text-[12.5px]"
            placeholder="Search name, email or role…"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted" strokeWidth={2.1} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus | "all")}
            className="field-input !w-auto !py-2 text-[12.5px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Any status" : s}
              </option>
            ))}
          </select>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan | "all")}
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
        <button onClick={() => setAdding(true)} className="btn-lime !py-2">
          <UserPlus className="h-4 w-4" strokeWidth={2.2} />
          Add user
        </button>
      </div>

      {/* bulk bar */}
      {sel.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-lime-deep/30 bg-lime-pale px-4 py-2.5">
          <span className="text-[12.5px] font-bold text-ink">
            {sel.length} selected
          </span>
          <div className="mx-1 h-4 w-px bg-lime-deep/30" />
          <button
            onClick={() => setStatusFor(sel, "active")}
            className="btn-ghost !border-transparent !bg-transparent !px-2.5 !py-1 text-[12px] hover:!bg-paper"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Activate
          </button>
          <button
            onClick={() => setStatusFor(sel, "suspended")}
            className="btn-ghost !border-transparent !bg-transparent !px-2.5 !py-1 text-[12px] hover:!bg-paper"
          >
            <Ban className="h-3.5 w-3.5" strokeWidth={2.2} /> Suspend
          </button>
          <button
            onClick={() => remove(sel)}
            className="btn-ghost !border-transparent !bg-transparent !px-2.5 !py-1 text-[12px] text-bad hover:!bg-paper"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} /> Remove
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto tiny font-semibold text-inksoft hover:text-ink"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* table */}
      <div className="panel overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Check
                    role="button"
                    tabIndex={0}
                    onClick={toggleAll}
                    className={`h-4 w-4 cursor-pointer rounded border ${
                      allChecked ? "border-lime-deep bg-lime text-ink" : "border-dash text-transparent"
                    }`}
                    strokeWidth={3}
                  />
                </th>
                <th className="th">User</th>
                <th className="th">Role</th>
                <th className="th">Plan</th>
                <th className="th">Status</th>
                <th className="th text-right">Streak</th>
                <th className="th text-right">onWards</th>
                <th className="th">Last active</th>
                <th className="th w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-line/70 transition last:border-0 hover:bg-cream/50 ${
                    selected.has(u.id) ? "bg-lime-pale/60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Check
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(u.id)}
                      className={`h-4 w-4 cursor-pointer rounded border ${
                        selected.has(u.id)
                          ? "border-lime-deep bg-lime text-ink"
                          : "border-dash text-transparent"
                      }`}
                      strokeWidth={3}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-ink">
                          {u.name}
                        </p>
                        <p className="tiny truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        u.plan === "Team"
                          ? "bg-ink text-paper"
                          : u.plan === "Pro"
                            ? "bg-lime-soft text-good"
                            : "bg-[#EFEFE6] text-inksoft"
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
                  <td className="td whitespace-nowrap">{u.lastActive}</td>
                  <td className="px-2 py-3">
                    <div className="group relative">
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-cream hover:text-ink">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div className="invisible absolute right-0 top-8 z-20 w-40 rounded-xl border border-line bg-paper p-1 opacity-0 shadow-pop transition group-hover:visible group-hover:opacity-100">
                        <button
                          onClick={() =>
                            setStatusFor(
                              [u.id],
                              u.status === "suspended" ? "active" : "suspended",
                            )
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-inksoft hover:bg-cream hover:text-ink"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {u.status === "suspended" ? "Reactivate" : "Suspend"}
                        </button>
                        <button
                          onClick={() => remove([u.id])}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-bad hover:bg-[#F6E0DC]"
                        >
                          <X className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <p className="text-[13px] font-semibold text-ink">
                      No users match those filters.
                    </p>
                    <p className="tiny mt-1">Try clearing the search or status.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <p className="tiny">
            Showing <span className="font-bold text-ink">{filtered.length}</span> of{" "}
            {rows.length} users
          </p>
          <div className="flex gap-1">
            <button className="btn-ghost !px-2.5 !py-1 text-[12px]" disabled>
              Prev
            </button>
            <button className="btn-ghost !px-2.5 !py-1 text-[12px]" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {adding ? <AddUserModal onClose={() => setAdding(false)} onAdd={addUser} /> : null}
    </div>
  );
}

function AddUserModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (u: AdminUser) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState<Plan>("Free");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAdd({
      id: `u_${Math.floor(Math.random() * 9000 + 1000)}`,
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || "Team member",
      plan,
      status: "invited",
      streak: 0,
      onwards: 0,
      joined: new Date().toISOString().slice(0, 10),
      lastActive: "Invited",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-pop"
      >
        <div className="flex items-center justify-between">
          <h2 className="h2">Invite a user</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoFocus />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@company.com" />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="field-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Product designer" />
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="field-input" value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-lime">
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}

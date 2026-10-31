"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { Button, TextInput } from "@/components/ui";
import { BackLink } from "@/components/ui";
import { useAuth, useCurrentUser } from "@/components/auth";
import { roles } from "@/lib/data";
import { Check, Plus } from "lucide-react";

function isCustomRole(role: string) {
  return Boolean(role) && !roles.includes(role);
}

export default function SetRolePage() {
  const router = useRouter();
  const profile = useCurrentUser();
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState(profile.role);
  const [customValue, setCustomValue] = useState(() =>
    isCustomRole(profile.role) ? profile.role : "",
  );
  const [customOpen, setCustomOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const showCustom = isCustomRole(selected);

  const openEditor = (prefill: string) => {
    setCustomValue(prefill);
    setCustomOpen(true);
  };

  const saveCustom = () => {
    const value = customValue.trim();
    if (!value) return;
    setSelected(value);
    setCustomValue(value);
    setCustomOpen(false);
  };

  async function save() {
    setBusy(true);
    setError("");
    const result = await updateProfile({ role: selected });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/profile");
  }

  return (
    <PhoneShell>
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Set your role</h1>
      </div>
      <p className="tiny mb-4">
        This shapes your portfolio and the tasks we suggest for your appraisal.
      </p>

      <div className="space-y-2">
        {roles.map((r) => {
          const active = selected === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelected(r)}
              className={`card flex w-full items-center justify-between px-4 py-3 text-left transition ${
                active ? "border-lime-deep bg-lime-pale" : "hover:border-dash"
              }`}
            >
              <span className="text-[12px] font-semibold text-ink">{r}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  active ? "border-lime-deep bg-lime text-ink" : "border-dash"
                }`}
              >
                {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}

        {showCustom ? (
          <button
            type="button"
            onClick={() => openEditor(selected)}
            className="card flex w-full items-center justify-between border-lime-deep bg-lime-pale px-4 py-3 text-left transition hover:border-lime-deep"
          >
            <span className="text-[12px] font-semibold text-ink">{selected}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-lime-deep bg-lime text-ink">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </button>
        ) : null}

        {customOpen ? (
          <div className="card border-lime-deep bg-lime-pale/50 p-3">
            <span className="label">Custom role</span>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TextInput
                  autoFocus
                  value={customValue}
                  maxLength={40}
                  placeholder="e.g. Product Designer"
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCustom();
                  }}
                />
              </div>
              <Button
                full={false}
                onClick={saveCustom}
                disabled={!customValue.trim()}
                className={customValue.trim() ? "" : "opacity-40"}
              >
                Save
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="mt-2 text-[11px] font-semibold text-muted transition hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : showCustom ? null : (
          <button
            type="button"
            onClick={() => openEditor("")}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-dash bg-transparent px-4 py-3 text-[12px] font-semibold text-inksoft transition hover:border-lime-deep hover:text-ink"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Add a custom role
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <Button onClick={save} disabled={busy || !selected}>
          {busy ? "Saving…" : "Save role"}
        </Button>
      </div>
    </PhoneShell>
  );
}

import type { UserStatus } from "@/lib/data";

export function Avatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-lime-soft font-bold text-ink"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

const STATUS: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-lime-soft text-good" },
  invited: { label: "Invited", cls: "bg-[#E7E2F5] text-[#6D5AA8]" },
  suspended: { label: "Suspended", cls: "bg-[#F6E0DC] text-bad" },
};

export function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: { value: string; up: boolean };
  hint?: string;
}) {
  return (
    <div className="panel p-5">
      <p className="tiny font-semibold uppercase tracking-[0.08em]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-[26px] font-bold leading-none tracking-tight text-ink">
          {value}
        </p>
        {delta ? (
          <span
            className={`badge ${delta.up ? "bg-lime-soft text-good" : "bg-[#F6E0DC] text-bad"}`}
          >
            {delta.up ? "▲" : "▼"} {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="tiny mt-2">{hint}</p> : null}
    </div>
  );
}

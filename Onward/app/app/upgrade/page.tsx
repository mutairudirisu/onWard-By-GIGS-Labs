"use client";

import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { ProBadge } from "@/components/pro";
import { useStore } from "@/components/store";
import { PLAN_FEATURES, PRO_PRICING } from "@/lib/data";

function ValueCell({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-soft text-lime-deep">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  if (value === false)
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream text-faint">
        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  return <span className="text-[12px] font-semibold text-ink">{value}</span>;
}

export default function UpgradePage() {
  const { isPro, wardsThisMonth, limits } = useStore();
  const save = PRO_PRICING.monthly - PRO_PRICING.yearly;

  return (
    <PhoneShell indicator wide>
      <div className="mb-4 flex items-center gap-1 lg:mb-2">
        <BackLink href="/profile" label="Back" />
      </div>

      <div className="mx-auto max-w-[560px] text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-ink shadow-card">
          <Sparkles className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[34px]">
          {isPro ? "You're on onWard Pro" : "Unlock onWard Pro"}
        </h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-[13px] leading-[1.5] text-muted lg:text-[14px]">
          {isPro
            ? "Thanks for growing with us. Every Pro capability is active on this device."
            : "Keep unlimited tasks and notes free. Pro removes the ceiling on everything that helps you go further."}
        </p>
      </div>

      {isPro ? (
        <div className="mx-auto mt-6 max-w-[560px]">
          <div className="card flex items-center gap-3 px-4 py-4">
            <ProBadge />
            <p className="flex-1 text-[13px] font-medium text-inksoft">
              Active until your next renewal. Manage anytime.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-[560px]">
          <div className="card overflow-hidden">
            <div className="flex items-stretch">
              <div className="flex-1 border-r border-line px-4 py-4 text-center">
                <p className="text-[13px] font-bold text-ink">Free</p>
                <p className="mt-1 text-[22px] font-bold tracking-tight text-ink">
                  {PRO_PRICING.currency}0
                </p>
                <p className="text-[11px] text-muted">forever</p>
              </div>
              <div className="relative flex-1 bg-dark px-4 py-4 text-center text-paper">
                <span className="absolute right-2 top-2">
                  <ProBadge />
                </span>
                <p className="text-[13px] font-bold">Pro</p>
                <p className="mt-1 text-[22px] font-bold tracking-tight">
                  {PRO_PRICING.currency}
                  {PRO_PRICING.yearly.toLocaleString("en-NG")}
                </p>
                <p className="text-[11px] text-paper/60">/mo, billed yearly</p>
              </div>
            </div>
            <p className="bg-cream px-4 py-2 text-center text-[11px] font-semibold text-lime-deep">
              Save {PRO_PRICING.currency}
              {(save * 12).toLocaleString("en-NG")} a year with annual billing
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/upgrade/pay"
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3.5 text-[14px] font-bold text-ink transition hover:bg-lime-deep active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.6} />
              Continue to payment
            </Link>
            <p className="mt-2 text-center text-[11px] text-muted">
              No card needed to keep using Free. Cancel Pro anytime in two taps.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 max-w-[560px]">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="eyebrow">Compare plans</p>
          {!isPro && limits.wardsPerMonth != null && (
            <span className="text-[11px] font-semibold text-muted">
              {wardsThisMonth}/{limits.wardsPerMonth} onWards this month
            </span>
          )}
        </div>
        <div className="card divide-y divide-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-cream px-4 py-2.5">
            <span />
            <span className="w-[68px] text-center text-[11px] font-bold uppercase tracking-wide text-muted">
              Free
            </span>
            <span className="w-[68px] text-center text-[11px] font-bold uppercase tracking-wide text-ink">
              Pro
            </span>
          </div>
          {PLAN_FEATURES.map((f) => (
            <div
              key={f.label}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3"
            >
              <span className="text-[12.5px] font-medium text-inksoft lg:text-[13.5px]">
                {f.label}
              </span>
              <span className="flex w-[68px] justify-center">
                <ValueCell value={f.free} />
              </span>
              <span className="flex w-[68px] justify-center">
                <ValueCell value={f.pro} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

"use client";

import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { ProBadge } from "@/components/pro";
import { useStore } from "@/components/store";
import { useCurrentUser } from "@/components/auth";
import { PLAN_FEATURES, PRO_PRICING, STUDENT_PRICING } from "@/lib/data";
import { isStudentRole, pricingFor } from "@/lib/student";

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
  const user = useCurrentUser();
  const student = isStudentRole(user.role);
  const pricing = pricingFor(user.role);
  const save = pricing.monthly - pricing.yearly;

  return (
    <PhoneShell indicator wide>
      <div className="mb-4 flex items-center gap-1 lg:mb-2">
        <BackLink href="/profile" label="Back" />
      </div>

      <div className="mx-auto max-w-[560px] text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-dark shadow-card">
          <Sparkles className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[34px]">
          {isPro ? "You're on onWard Pro" : "Unlock onWard Pro"}
        </h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-[13px] leading-[1.5] text-muted lg:text-[14px]">
          {isPro
            ? "Thanks for growing with us. Every Pro capability is active on this device."
            : "Three onWards a month stay free. Pro removes the ceiling on everything that helps you go further."}
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
                  {pricing.currency}0
                </p>
                <p className="text-[11px] text-muted">forever</p>
              </div>
              <div className="relative flex-1 bg-panel px-4 py-4 text-center text-on-panel">
                <span className="absolute right-2 top-2">
                  <ProBadge />
                </span>
                <p className="text-[13px] font-bold">
                  Pro
                  {student ? (
                    <span className="ml-1.5 rounded-full bg-lime px-1.5 py-0.5 align-middle text-[8px] font-bold uppercase tracking-wide text-dark">
                      Student
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-[22px] font-bold tracking-tight">
                  {pricing.currency}
                  {pricing.yearly.toLocaleString("en-NG")}
                </p>
                <p className="text-[11px] text-on-panel/60">
                  {student ? (
                    <>
                      /mo, billed yearly ·{" "}
                      <span className="line-through">
                        {PRO_PRICING.currency}
                        {PRO_PRICING.yearly.toLocaleString("en-NG")}
                      </span>
                    </>
                  ) : (
                    "/mo, billed yearly"
                  )}
                </p>
              </div>
            </div>
            <p className="bg-cream px-4 py-2 text-center text-[11px] font-semibold text-lime-deep">
              {student
                ? `Student rate - ${PRO_PRICING.currency}${PRO_PRICING.monthly.toLocaleString("en-NG")}/mo becomes ${pricing.currency}${pricing.monthly.toLocaleString("en-NG")}/mo`
                : `Save ${pricing.currency}${(save * 12).toLocaleString("en-NG")} a year with annual billing`}
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/upgrade/pay"
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3.5 text-[14px] font-bold text-dark transition hover:bg-lime-deep active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.6} />
              Continue to payment
            </Link>
            <p className="mt-2 text-center text-[11px] text-muted">
              No card needed to keep using Free. Cancel Pro anytime in two taps.
            </p>
            {!student ? (
              <Link
                href="/student"
                className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-cream px-3.5 py-2.5"
              >
                <span className="text-[11px] font-semibold text-ink">
                  Still in school? There is a student rate
                </span>
                <span className="text-[11px] font-bold text-lime-deep">
                  {STUDENT_PRICING.currency}
                  {STUDENT_PRICING.monthly.toLocaleString("en-NG")}/mo
                </span>
              </Link>
            ) : null}
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

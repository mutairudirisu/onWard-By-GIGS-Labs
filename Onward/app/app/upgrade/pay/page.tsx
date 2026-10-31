"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  Lock,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { useStore } from "@/components/store";
import { useCurrentUser } from "@/components/auth";
import { PRO_PRICING } from "@/lib/data";
import { isStudentRole, pricingFor } from "@/lib/student";

type Period = "monthly" | "yearly";
type Method = "card" | "transfer" | "ussd";
type Status = "idle" | "processing" | "done";

const METHODS: { id: Method; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: "card", label: "Card", hint: "Verve, Mastercard, Visa", icon: <CreditCard className="h-[18px] w-[18px]" /> },
  { id: "transfer", label: "Bank transfer", hint: "Pay instantly from your bank", icon: <Banknote className="h-[18px] w-[18px]" /> },
  { id: "ussd", label: "USSD", hint: "Dial from any phone", icon: <Smartphone className="h-[18px] w-[18px]" /> },
];

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

export default function PayPage() {
  const router = useRouter();
  const { isPro, setPlan } = useStore();

  const [period, setPeriod] = useState<Period>("yearly");
  const [method, setMethod] = useState<Method>("card");
  const [status, setStatus] = useState<Status>("idle");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const user = useCurrentUser();
  const student = isStudentRole(user.role);
  const pricing = pricingFor(user.role);
  const monthly = pricing.monthly;
  const total = period === "yearly" ? pricing.yearly * 12 : monthly;
  const cardValid =
    card.number.replace(/\s/g, "").length === 16 &&
    card.name.trim().length > 1 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3;
  const canPay = status === "idle" && (method !== "card" || cardValid);

  function pay() {
    if (status !== "idle") return;
    setStatus("processing");
    setTimeout(() => {
      setPlan("pro");
      setStatus("done");
    }, 1500);
  }

  if (status === "done") {
    return (
      <PhoneShell indicator>
        <div className="mx-auto flex max-w-[420px] flex-col items-center pt-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime text-dark">
            <BadgeCheck className="h-9 w-9" strokeWidth={2.2} />
          </span>
          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">
            You&apos;re on Pro
          </h1>
          <p className="mt-2 text-[13px] leading-[1.5] text-muted">
            Unlimited onWards, reminders on every task, verified skills and
            every share link are now unlocked. Growth has no ceiling.
          </p>
          <div className="mt-7 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/onwards/new")}
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3.5 text-[14px] font-bold text-dark transition hover:bg-lime-deep"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.6} />
              Log your first Pro onWard
            </button>
            <Link
              href="/today"
              className="flex w-full items-center justify-center rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
            >
              Back to today
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell indicator wide>
      <div className="mb-4 flex items-center gap-1">
        <BackLink href="/upgrade" label="Back to plans" />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div className="mx-auto max-w-[520px] lg:mx-0">
          <h1 className="text-[22px] font-bold tracking-tight text-ink lg:text-[26px]">
            Complete your upgrade
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {isPro
              ? "You already have Pro — this is a demo checkout."
              : "One payment unlocks everything. Cancel anytime."}
          </p>

          {/* Billing period */}
          <p className="eyebrow mt-6 mb-2">Billing</p>
          <div className="grid grid-cols-2 gap-2">
            {(["monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  period === p
                    ? "border-lime-deep bg-lime-pale"
                    : "border-line bg-paper hover:border-dash"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-[13px] font-bold capitalize text-ink">{p}</span>
                  {period === p ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime text-dark">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {p === "yearly"
                    ? `${pricing.currency}${pricing.yearly.toLocaleString("en-NG")}/mo · 2 months free`
                    : `${pricing.currency}${monthly.toLocaleString("en-NG")}/mo`}
                </span>
              </button>
            ))}
          </div>

          {/* Method */}
          <p className="eyebrow mt-6 mb-2">Payment method</p>
          <div className="card divide-y divide-line overflow-hidden">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                  method === m.id ? "bg-lime-pale" : "hover:bg-cream"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-inksoft">
                  {m.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink">{m.label}</span>
                  <span className="block text-[11px] text-muted">{m.hint}</span>
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    method === m.id ? "border-lime-deep bg-lime" : "border-dash"
                  }`}
                >
                  {method === m.id ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
                </span>
              </button>
            ))}
          </div>

          {/* Card form */}
          {method === "card" ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="card-number">Card number</label>
                <input
                  id="card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: formatCard(e.target.value) }))}
                  className="field-input tracking-[0.12em]"
                />
              </div>
              <div>
                <label className="label" htmlFor="card-name">Name on card</label>
                <input
                  id="card-name"
                  autoComplete="cc-name"
                  placeholder="Name as it appears on your card"
                  value={card.name}
                  onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                  className="field-input"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="label" htmlFor="card-exp">Expiry</label>
                  <input
                    id="card-exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    className="field-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label" htmlFor="card-cvv">CVV</label>
                  <input
                    id="card-cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={card.cvv}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                    }
                    className="field-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-dash bg-cream px-4 py-4 text-[12.5px] leading-[1.5] text-inksoft">
              {method === "transfer" ? (
                <>A one-time bank transfer reference will appear after you tap pay. Funds settle instantly and your Pro access begins right away.</>
              ) : (
                <>After you tap pay, dial the generated USSD code on your phone and approve the debit. No smartphone or card required.</>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="mt-8 lg:mt-0">
          <div className="card sticky top-6 overflow-hidden">
            <div className="bg-panel px-4 py-4 text-on-panel">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lime" strokeWidth={2.4} />
                <span className="text-[13px] font-bold">onWard Pro</span>
                {student ? (
                  <span className="rounded-full bg-lime px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-dark">
                    Student
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-on-panel/60">
                {period === "yearly" ? "Billed yearly" : "Billed monthly"}
              </p>
            </div>
            <div className="space-y-2 px-4 py-4 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-muted">Plan</span>
                <span className="font-semibold text-ink">
                  {pricing.currency}
                  {(period === "yearly" ? pricing.yearly : monthly).toLocaleString("en-NG")}
                  /mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Billing cycle</span>
                <span className="font-semibold text-ink">
                  {period === "yearly" ? "12 months" : "1 month"}
                </span>
              </div>
              {period === "yearly" ? (
                <div className="flex justify-between text-lime-deep">
                  <span className="font-semibold">Annual discount</span>
                  <span className="font-bold">
                    −{pricing.currency}
                    {((monthly - pricing.yearly) * 12).toLocaleString("en-NG")}
                  </span>
                </div>
              ) : null}
              {student ? (
                <div className="flex justify-between text-lime-deep">
                  <span className="font-semibold">Student discount</span>
                  <span className="font-bold">
                    −{pricing.currency}
                    {(
                      (PRO_PRICING.monthly - pricing.monthly) *
                      (period === "yearly" ? 12 : 1)
                    ).toLocaleString("en-NG")}
                  </span>
                </div>
              ) : null}
              <div className="mt-1 flex items-end justify-between border-t border-line pt-3">
                <span className="text-[13px] font-bold text-ink">Total due today</span>
                <span className="text-[18px] font-bold tracking-tight text-ink">
                  {pricing.currency}
                  {total.toLocaleString("en-NG")}
                </span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                disabled={!canPay}
                onClick={pay}
                className="flex w-full items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3.5 text-[14px] font-bold text-dark transition hover:bg-lime-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "processing" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" strokeWidth={2.4} />
                    Pay {pricing.currency}
                    {total.toLocaleString("en-NG")}
                  </>
                )}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10.5px] text-faint">
                <Lock className="h-3 w-3" />
                Secure demo checkout — no real charge
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PhoneShell>
  );
}

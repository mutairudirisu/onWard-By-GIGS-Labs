"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Loader2 } from "lucide-react";
import { fetchMyReferrals, type MyReferrals } from "@/lib/db";
import { useAuth } from "./auth";
import { ShareButton } from "./share-button";

const GOAL = 3;

export function ReferralCard() {
  const { user } = useAuth();
  const [data, setData] = useState<MyReferrals | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchMyReferrals()
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setState(next ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (state === "loading") {
    return (
      <section className="card flex items-center justify-center gap-2 px-5 py-6 text-[11px] text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your invite code…
      </section>
    );
  }

  if (state === "error" || !data) {
    return (
      <section className="card px-5 py-4">
        <h2 className="text-[14px] font-bold tracking-tight text-ink lg:text-[17px]">Invite a friend</h2>
        <p className="mt-1 text-[10px] text-muted lg:text-[11.5px]">
          Your invite code is warming up. Check back in a moment.
        </p>
      </section>
    );
  }

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/create-account?ref=${data.code}`
      : `/create-account?ref=${data.code}`;
  const qualified = data.referrals.filter((r) => r.status === "qualified").length;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="card px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-soft text-inksoft">
          <Gift className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold tracking-tight text-ink lg:text-[17px]">
            Invite a friend
          </h2>
          <p className="mt-0.5 text-[10px] leading-[1.5] text-muted lg:text-[11.5px]">
            Three friends who log their first onWard = one month of Pro, on us.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-dash bg-cream/60 px-3 py-2.5">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
          Your code
        </span>
        <span className="ml-auto font-mono text-[15px] font-bold tracking-[0.16em] text-ink">
          {data.code}
        </span>
        <button
          type="button"
          onClick={() => copy(data.code)}
          aria-label="Copy invite code"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-inksoft transition hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-lime-deep" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {Array.from({ length: GOAL }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < data.credits ? "bg-lime-deep" : "bg-line"}`}
          />
        ))}
        <span className="shrink-0 text-[9px] font-semibold text-muted">
          {Math.min(data.credits, GOAL)}/{GOAL}
        </span>
      </div>
      <p className="mt-1.5 text-[9px] leading-[1.5] text-muted">
        {data.proUntil && Date.parse(data.proUntil) > Date.now()
          ? `Pro is active until ${new Date(data.proUntil).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}.`
          : `${GOAL - data.credits} more qualified invite${
              GOAL - data.credits === 1 ? "" : "s"
            } to unlock a month of Pro.`}
      </p>

      {data.referrals.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-line pt-3">
          {data.referrals.slice(0, 4).map((r) => (
            <li key={`${r.name}-${r.joined}`} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[9px] font-bold text-ink">
                {r.initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">
                {r.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                  r.status === "qualified" ? "bg-lime-soft text-ink" : "bg-cream text-muted"
                }`}
              >
                {r.status === "qualified" ? "Qualified" : "Joined"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex gap-2">
        <ShareButton
          text="Join me on onWard — plan your day, capture your wins, and build a record of your work. Use my invite code when you sign up."
          url={link}
          label="Share invite"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-lime px-3 py-2 text-[10.5px] font-bold text-ink transition hover:bg-lime-deep"
        />
        <button
          type="button"
          onClick={() => copy(link)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-dash bg-paper px-3 py-2 text-[10.5px] font-semibold text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-lime-deep" /> : <Copy className="h-3.5 w-3.5" />}
          Copy link
        </button>
      </div>
      {qualified > 0 ? (
        <p className="mt-2 text-[9px] text-muted">
          {qualified} friend{qualified === 1 ? "" : "s"} qualified so far.
        </p>
      ) : null}
    </section>
  );
}

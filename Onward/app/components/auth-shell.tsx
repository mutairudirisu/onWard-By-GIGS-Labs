import type { ReactNode } from "react";
import { Check, Lock, Sprout } from "lucide-react";
import { HomeIndicator } from "./phone-shell";
import { Wordmark } from "./wordmark";

const PREVIEW = [
  { title: "Review project milestones", meta: "Atlas onboarding", done: true },
  { title: "Send the onboarding summary", meta: "Add results to project notes", done: true },
  { title: "Milestone review at 10:00", meta: "Calendar · Today", done: false },
];

/**
 * Auth layout. Mobile (PWA): a single centred column, like the rest of the app.
 * Desktop (lg+): a split screen — brand banner on the left, the form on the right.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-dark lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-lime/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lime/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(201,242,78,0.16) 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime shadow-card">
            <Sprout className="h-5 w-5 text-ink" strokeWidth={2.2} />
          </span>
          <Wordmark tone="paper" className="text-[18px]" />
        </div>

        <div className="relative my-10">
          <h2 className="max-w-[15ch] text-[34px] font-bold leading-[1.08] tracking-tight text-paper xl:text-[40px]">
            Your everyday, going places.
          </h2>
          <p className="mt-4 max-w-[40ch] text-[14px] leading-relaxed text-paper/70">
            Plan your day, capture your wins and build a story of your work you&apos;re proud to
            share.
          </p>

          <div className="relative mt-9 max-w-[360px] rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-lime">
                <Sprout className="h-3 w-3" strokeWidth={2.4} /> Today
              </span>
              <span className="text-[10px] font-semibold text-paper/50">Wed · 28 Oct</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {PREVIEW.map((r) => (
                <div key={r.title} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      r.done ? "bg-lime" : "border border-white/25"
                    }`}
                  >
                    {r.done ? <Check className="h-2.5 w-2.5 text-ink" strokeWidth={3} /> : null}
                  </span>
                  <span>
                    <span
                      className={`block text-[12px] font-semibold ${
                        r.done ? "text-paper/45 line-through" : "text-paper"
                      }`}
                    >
                      {r.title}
                    </span>
                    <span className="block text-[10px] text-paper/45">{r.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-paper/55">
          <Lock className="h-3.5 w-3.5" /> Private by default. Your work stays yours.
        </div>
      </aside>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5 lg:px-12 lg:py-14 xl:px-20">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col lg:max-w-[440px] lg:justify-center">
          {children}
        </div>
        <div className="lg:hidden">
          <HomeIndicator />
        </div>
      </div>
    </div>
  );
}

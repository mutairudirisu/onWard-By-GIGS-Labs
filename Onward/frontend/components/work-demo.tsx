"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  FileText,
  FolderOpen,
  Sparkles,
  Sprout,
} from "lucide-react";
import { SIGNUP_URL } from "@/lib/site";

type DemoView = "capture" | "portfolio";

export function WorkDemo() {
  const [view, setView] = useState<DemoView>("capture");

  return (
    <section
      className="overflow-hidden border-y border-line bg-[#F7F8F3] py-20 sm:py-24 lg:py-32"
    >
      <div className="container-x grid items-center gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20">
        <div className="mx-auto max-w-xl lg:mx-0">
          <p className="eyebrow">From the moment to the meaning</p>
          <h2 className="editorial-heading mt-4">
            Keep the work. See the story it tells.
          </h2>
          <p className="lead mt-5">
            The details that make a great review or portfolio are easy to lose
            in the rush of the week. onWard helps you save them while they are
            still fresh.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Capture what you did and what changed",
              "Keep skills and evidence with the work",
              "Bring the right wins into your portfolio",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] font-medium leading-relaxed text-ink/80"
              >
                <span className="check">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href={SIGNUP_URL}
            className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-ink transition hover:gap-3"
          >
            Start with one win <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-[620px]">
          <span className="pointer-events-none absolute -left-12 -top-14 h-48 w-48 rounded-full bg-lime/25 blur-3xl" />
          <div className="relative overflow-hidden rounded-[26px] border border-line bg-paper p-3 shadow-[0_26px_80px_-40px_rgba(16,17,8,0.28)] sm:rounded-[30px] sm:p-5">
            <div
              aria-label="onWard product preview"
              className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-mist p-1"
              role="group"
            >
              <button
                type="button"
                aria-pressed={view === "capture"}
                aria-controls="work-demo-panel"
                onClick={() => setView("capture")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold transition ${
                  view === "capture"
                    ? "bg-ink text-paper shadow-card"
                    : "text-ink/55 hover:text-ink"
                }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                Capture the work
              </button>
              <button
                type="button"
                aria-pressed={view === "portfolio"}
                aria-controls="work-demo-panel"
                onClick={() => setView("portfolio")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold transition ${
                  view === "portfolio"
                    ? "bg-ink text-paper shadow-card"
                    : "text-ink/55 hover:text-ink"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Carry it forward
              </button>
            </div>

            <div
              id="work-demo-panel"
              role="region"
              aria-live="polite"
              aria-label={view === "capture" ? "Example captured work" : "Example portfolio entry"}
              className="min-h-[322px] rounded-[20px] bg-[#F8F9F5] p-4 transition sm:min-h-[342px] sm:p-6"
            >
              {view === "capture" ? (
                <div className="motion-safe:animate-[onward-fade_220ms_ease-out]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-lime-pale text-lime-deep">
                        <Sprout className="h-4 w-4" />
                      </span>
                      Example onWard
                    </span>
                    <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[9px] font-semibold text-muted">
                      28 October
                    </span>
                  </div>

                  <h3 className="mt-5 max-w-[430px] text-[clamp(20px,3vw,30px)] font-bold leading-tight tracking-[-0.045em] text-ink">
                    Smoothed the onboarding handoff
                  </h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line bg-white p-3.5">
                      <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-muted">
                        What changed
                      </p>
                      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-ink">
                        Review round went from four days to two.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-line bg-white p-3.5">
                      <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-muted">
                        Skills in the work
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {["Process design", "Collaboration"].map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-lime-pale px-2.5 py-1 text-[8px] font-semibold text-ink/75"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-line bg-white/70 px-3.5 py-3">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="text-[9px] font-medium text-muted">
                      Evidence stays beside the achievement
                    </span>
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-lime text-ink">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="motion-safe:animate-[onward-fade_220ms_ease-out]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-ink text-lime">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      Selected for your portfolio
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted" />
                  </div>
                  <div className="mt-5 rounded-[18px] bg-night p-4 text-paper sm:p-5">
                    <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-lime">
                      Operations · Process improvement
                    </p>
                    <h3 className="mt-2 text-[20px] font-bold leading-tight tracking-[-0.04em] sm:text-[24px]">
                      A handoff that moves work forward.
                    </h3>
                    <p className="mt-2 max-w-md text-[10px] leading-relaxed text-paper/60">
                      Simplified the onboarding handoff and reduced the review
                      round from four days to two.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {["Process design", "Collaboration", "Evidence attached"].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full border border-paper/15 px-2.5 py-1 text-[8px] font-medium text-paper/75"
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-3">
                    <span className="flex items-center gap-2 text-[9px] font-semibold text-ink/75">
                      <Sparkles className="h-3.5 w-3.5 text-lime-deep" />
                      Your work, ready when you are
                    </span>
                    <span className="text-[8px] font-medium text-muted">Example entry</span>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 px-1 text-center text-[9px] font-medium text-muted">
              A sample entry · your work stays private until you choose to share it
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

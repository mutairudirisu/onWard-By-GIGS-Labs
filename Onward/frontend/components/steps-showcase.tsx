"use client";

import { useEffect, useRef, useState } from "react";
import {
  InsightsScreen,
  LogWardScreen,
  PortfolioScreen,
  TodayScreen,
} from "@/components/screens";

const STEPS = [
  {
    n: "1",
    title: "Tap + and log what happened.",
    body: "One screen: what you did, what changed because of it, and the skills you used. Dictate the title when typing is the slower option.",
    screen: <LogWardScreen />,
  },
  {
    n: "2",
    title: "It files itself on the day.",
    body: "Every capture is dated the moment you save it, so the record reads back as a timeline you can move through — not a pile to re-sort later.",
    screen: <TodayScreen />,
  },
  {
    n: "3",
    title: "Read it back when you need to.",
    body: "Insights adds the captures up, the heatmap keeps six months of the days you turned up, and the skills listed are the ones your own entries used.",
    screen: <InsightsScreen />,
  },
  {
    n: "4",
    title: "Compile the proof.",
    body: "Flag the onWards that matter and they gather on one page — the wins with their impact, the skills they show — which downloads as a PDF you can send.",
    screen: <PortfolioScreen />,
  },
];

export function StepsShowcase() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const updateActiveStep = () => {
      frame = 0;
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      const bounds = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const travelled = Math.min(distance, Math.max(0, -bounds.top));
      const next = Math.min(
        STEPS.length - 1,
        Math.floor((travelled / distance) * STEPS.length),
      );
      setActive((current) => (current === next ? current : next));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveStep);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = Number((visible.target as HTMLElement).dataset.step);
        if (!Number.isNaN(next)) setActive(next);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0.1, 0.4, 0.7] },
    );
    stepRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const navigateToStep = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const bounds = section.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + bounds.top + index * window.innerHeight + 1,
      behavior: "smooth",
    });
  };

  const current = STEPS[active] ?? STEPS[0]!;

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative bg-night text-paper"
    >
      <div className="sticky top-0 hidden h-[100svh] md:block">
        <div className="container-x h-full">
          <div className="grid h-full items-center gap-5 pb-8 pt-28 md:grid-cols-[minmax(0,0.95fr)_minmax(180px,0.8fr)_minmax(0,1.05fr)] lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.9fr)_minmax(0,1.05fr)] xl:grid-cols-[minmax(0,1fr)_minmax(290px,0.9fr)_minmax(0,1.05fr)]">
            <div className="min-w-0">
              <p className="eyebrow">Simple by design</p>
              <h2 className="editorial-heading mt-4 max-w-xl text-paper">
                Make the work count. Keep the proof.
              </h2>
              <nav aria-label="How onWard works" className="mt-8 space-y-2">
                {STEPS.map((step, index) => (
                  <button
                    key={step.n}
                    type="button"
                    aria-current={index === active ? "step" : undefined}
                    onClick={() => navigateToStep(index)}
                    className={`flex w-full items-start gap-3 border-l-2 py-2.5 pl-4 text-left transition-colors duration-300 ${
                      index === active
                        ? "border-lime text-paper"
                        : "border-paper/15 text-paper/40 hover:text-paper/75"
                    }`}
                  >
                    <span
                      className={`pt-0.5 text-[11px] font-bold tabular-nums ${
                        index === active ? "text-lime" : "text-paper/35"
                      }`}
                    >
                      0{step.n}
                    </span>
                    <span className="text-[13px] font-semibold leading-snug lg:text-[14px]">
                      {step.title}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex h-full min-w-0 items-center justify-center">
              <div
                key={current.n}
                className="motion-safe:animate-[onward-fade_420ms_ease-out] max-h-[min(74svh,740px)] w-full max-w-[330px] overflow-hidden rounded-[36px]"
                aria-label={`Product screen, step ${current.n}`}
              >
                {current.screen}
              </div>
            </div>

            <div
              key={`copy-${current.n}`}
              aria-live="polite"
              aria-atomic="true"
              className="min-w-0 max-w-xl motion-safe:animate-[onward-fade_360ms_ease-out]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">
                Step 0{current.n} of 04
              </p>
              <h3 className="editorial-heading mt-4 text-paper">
                {current.title}
              </h3>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-paper/60 sm:text-[17px]">
                {current.body}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="hidden md:block">
        {STEPS.map((step) => (
          <div key={step.n} className="h-[100svh]" />
        ))}
      </div>

      <div className="container-x py-20 md:hidden">
        <div className="mb-5">
          <p className="eyebrow">Simple by design</p>
          <h2 className="editorial-heading mt-4 max-w-xl text-paper">
            Make the work count. Keep the proof.
          </h2>
        </div>

        {STEPS.map((step, index) => (
          <article
            key={step.n}
            data-step={index}
            ref={(element) => {
              stepRefs.current[index] = element;
            }}
            className="py-8"
          >
            <div
              className={`flex gap-4 border-l-2 pl-4 transition-colors duration-500 ${
                index === active ? "border-lime" : "border-paper/15"
              }`}
            >
              <span
                className={`text-[14px] font-bold tabular-nums ${
                  index === active ? "text-lime" : "text-paper/40"
                }`}
              >
                0{step.n}
              </span>
              <div className="min-w-0">
                <h3 className="text-[20px] font-bold leading-snug tracking-tight text-paper">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-paper/60">
                  {step.body}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center pt-8">
              {step.screen}
              <p className="mt-4 text-[11px] font-medium text-paper/35">
                Step {step.n} · sample entries
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

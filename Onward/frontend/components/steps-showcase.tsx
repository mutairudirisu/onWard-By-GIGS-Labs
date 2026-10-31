"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: "1",
    title: "Tap + and log what happened.",
    body: "A task done, a note written, a win at work — capture it in one sheet while it is still fresh.",
    img: "/app-log-onward.png",
    alt: "onWard Log an onWard screen",
  },
  {
    n: "2",
    title: "Notes keep the reasoning.",
    body: "The why behind the what. Jot a thought and it stays attached to the day it mattered, searchable later.",
    img: "/app-notes.png",
    alt: "onWard notes library screen",
  },
  {
    n: "3",
    title: "onWard files it for you.",
    body: "Tags, dates and goals update automatically. Your weekly plan stays honest without bookkeeping.",
    img: "/app-tasks.png",
    alt: "onWard tasks list screen",
  },
  {
    n: "4",
    title: "Your timeline builds itself.",
    body: "Small logs grow into milestones, milestones grow into a portfolio you can share in one link.",
    img: "/app-onwards.png",
    alt: "onWard timeline screen",
  },
  {
    n: "5",
    title: "Insights make it undeniable.",
    body: "A calm look at momentum — skills, streaks and hours, so you can see the growth you can no longer argue with.",
    img: "/app-insights.png",
    alt: "onWard insights screen",
  },
];

export function StepsShowcase() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.step,
            );
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="bg-night text-paper">
      <div className="container-x grid gap-4 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <p className="eyebrow">Simple by design</p>
          <h2 className="h2 mt-4">
            Five taps.
            <br />
            Under a minute.
          </h2>

          {STEPS.map((s, i) => (
            <div
              key={s.n}
              data-step={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="flex min-h-[46vh] items-center lg:min-h-[64vh]"
            >
              <div
                className={`flex gap-6 transition-all duration-500 ${
                  i === active ? "opacity-100" : "opacity-35"
                }`}
              >
                <span
                  className={`text-[34px] font-bold leading-none transition-colors duration-500 sm:text-[40px] ${
                    i === active ? "text-lime" : "text-paper/40"
                  }`}
                >
                  {s.n}
                </span>
                <div className="max-w-sm">
                  <h3
                    className={`text-[20px] font-bold leading-snug tracking-tight sm:text-[24px] ${
                      i === active ? "text-paper" : "text-paper/70"
                    }`}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-paper/55">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 flex h-[calc(100vh-12rem)] items-center justify-center">
            <div className="relative aspect-[400/820] w-[320px] overflow-hidden rounded-[44px] border-[6px] border-[#3A3B30] bg-cream shadow-lift">
              {STEPS.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.img}
                  src={s.img}
                  alt={s.alt}
                  className={`absolute left-1/2 top-0 w-[125%] max-w-none -translate-x-1/2 transition-opacity duration-700 ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <span className="absolute bottom-3 left-1/2 h-[5px] w-28 -translate-x-1/2 rounded-full bg-ink/80" />
            </div>
          </div>
        </div>
      </div>

      {/* mobile: phone below each step is heavy; show single static preview */}
      <div className="container-x pb-20 lg:hidden">
        <div className="relative mx-auto aspect-[400/820] w-[280px] overflow-hidden rounded-[40px] border-[6px] border-[#3A3B30] bg-cream shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STEPS[active].img}
            alt={STEPS[active].alt}
            className="absolute left-1/2 top-0 w-[125%] max-w-none -translate-x-1/2"
          />
          <span className="absolute bottom-3 left-1/2 h-[5px] w-28 -translate-x-1/2 rounded-full bg-ink/80" />
        </div>
      </div>
    </section>
  );
}

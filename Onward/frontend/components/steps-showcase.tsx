"use client";

import { useEffect, useRef, useState } from "react";
import {
  CreateSheetScreen,
  InsightsScreen,
  LogWardScreen,
  NotesScreen,
  ReminderScreen,
} from "@/components/screens";

const STEPS = [
  {
    n: "1",
    title: "Tap + and log what happened.",
    body: "A task, a note or a win, from the same sheet, while it is still fresh. Enter adds the next step, so a task can be a list by the time you look up.",
    screen: <CreateSheetScreen />,
  },
  {
    n: "2",
    title: "Give the day a time that survives it.",
    body: "A time on a task or a note becomes a reminder. If the moment passes, the row turns red and waits — you can silence the nudge without touching the work.",
    screen: <ReminderScreen />,
  },
  {
    n: "3",
    title: "Notes keep the reasoning.",
    body: "The why behind the what. Tick the lines inside the note, and the note stays filed on the day you wrote it — searchable later.",
    screen: <NotesScreen />,
  },
  {
    n: "4",
    title: "Name the win, and what changed.",
    body: "An onWard asks what you did and what was different because of it. Two sentences. Skills you tagged come along, so the proof has a shape.",
    screen: <LogWardScreen />,
  },
  {
    n: "5",
    title: "Read it back when you need to.",
    body: "Insights adds the steps up, the heatmap shows the days you turned up, and the skills listed are the ones your own entries used.",
    screen: <InsightsScreen />,
  },
];

export function StepsShowcase() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* On phones each step carries its own screen, so the scroll never has to
     explain a picture that lives off at the top of the section. */
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.step);
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
            Two minutes a day,
            <br />
            and it keeps.
          </h2>

          {STEPS.map((s, i) => (
            <div
              key={s.n}
              data-step={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="lg:flex lg:min-h-[58vh] lg:items-center"
            >
              <div
                className={`flex gap-5 py-9 transition-opacity duration-500 lg:py-0 ${
                  i === active ? "opacity-100" : "lg:opacity-40"
                }`}
              >
                <span
                  className={`text-[26px] font-bold leading-none transition-colors duration-500 sm:text-[32px] ${
                    i === active ? "text-lime" : "text-paper/40"
                  }`}
                >
                  {s.n}
                </span>
                <div className="max-w-sm">
                  <h3
                    className={`text-[19px] font-bold leading-snug tracking-tight sm:text-[22px] ${
                      i === active ? "text-paper" : "text-paper/70"
                    }`}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-paper/55 sm:text-[15px]">
                    {s.body}
                  </p>
                </div>
              </div>

              {/* the screen for this step, right under its words — desktop gets
                  the sticky column instead */}
              <div className="flex flex-col items-center pb-12 lg:hidden">
                {s.screen}
                <p className="mt-4 text-[11px] font-medium text-paper/35">
                  Step {s.n} · sample entries
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 flex h-[calc(100vh-12rem)] items-center justify-center">
            <div className="relative flex w-full max-w-[340px] items-center justify-center">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  aria-hidden={i !== active}
                  className={`transition-opacity duration-500 ${
                    i === active
                      ? "relative opacity-100"
                      : "absolute inset-0 opacity-0"
                  }`}
                >
                  {s.screen}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

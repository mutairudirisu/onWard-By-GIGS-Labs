"use client";

import { useEffect, useRef, useState } from "react";
import { ProductPhone } from "@/components/product-phone";

const STEPS = [
  {
    n: "1",
    title: "Start with what matters today.",
    body: "Keep your day moving with a clear view of your tasks, focus sessions, checklist and recent work.",
    image: "/app-screens/home-light.jpg",
    alt: "onWard home screen with calendar, focus timer, checklist and recent onWards",
  },
  {
    n: "2",
    title: "Keep your work remembered.",
    body: "Bring your onWards together in one timeline, with the skills, results and evidence connected to each win.",
    image: "/app-screens/onwards-light.jpg",
    alt: "onWard timeline showing saved work wins and their impact",
  },
  {
    n: "3",
    title: "Share ideas in the Exchange.",
    body: "See community posts, take part in conversations and learn from other people’s work and ideas.",
    image: "/app-screens/exchange-light.jpg",
    alt: "onWard Exchange feed with community posts and reactions",
  },
  {
    n: "4",
    title: "Grow your network.",
    body: "Find people and keep up with your connections in My Network.",
    image: "/app-screens/network-light.jpg",
    alt: "onWard My Network screen with connections and people suggestions",
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
              <ProductPhone
                key={current.n}
                src={current.image}
                alt={current.alt}
                sizes="(min-width: 1024px) 260px, (min-width: 768px) 220px, 84vw"
                className="motion-safe:animate-[onward-fade_420ms_ease-out] max-w-[min(260px,34svh)]"
              />
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
              <ProductPhone
                src={step.image}
                alt={step.alt}
                sizes="(min-width: 768px) 260px, 84vw"
                className="max-w-[260px]"
              />
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

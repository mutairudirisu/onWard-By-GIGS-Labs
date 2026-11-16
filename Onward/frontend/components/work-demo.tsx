"use client";

import { useState } from "react";
import { ArrowUpRight, Check, FolderOpen, Sprout } from "lucide-react";
import { ProductPhone } from "@/components/product-phone";
import { SIGNUP_URL } from "@/lib/site";

const SCREENS = [
  {
    label: "Capture the work",
    Icon: Sprout,
    src: "/app-screens/home-light.jpg",
    alt: "onWard home screen showing the calendar, focus timer, checklist and recent work",
  },
  {
    label: "Carry it forward",
    Icon: FolderOpen,
    src: "/app-screens/onwards-light.jpg",
    alt: "onWard timeline of saved work and its impact",
  },
];

export function WorkDemo() {
  const [active, setActive] = useState(0);
  const screen = SCREENS[active]!;

  return (
    <section className="overflow-hidden border-y border-line bg-[#F7F8F3] py-20 sm:py-24 lg:py-32">
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
          <div className="relative flex flex-col items-center overflow-hidden rounded-[26px] border border-line bg-paper p-3 shadow-[0_26px_80px_-40px_rgba(16,17,8,0.28)] sm:rounded-[30px] sm:p-5">
            <div
              aria-label="Choose an onWard preview"
              className="mb-5 grid w-full grid-cols-2 gap-1 rounded-full bg-mist p-1"
              role="group"
            >
              {SCREENS.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={active === index}
                  aria-controls="work-demo-panel"
                  onClick={() => setActive(index)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold transition ${
                    active === index
                      ? "bg-ink text-paper shadow-card"
                      : "text-ink/55 hover:text-ink"
                  }`}
                >
                  <item.Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
            <div
              id="work-demo-panel"
              role="region"
              aria-live="polite"
              aria-label={screen.label}
              className="w-full"
            >
              <ProductPhone
                key={screen.src}
                src={screen.src}
                alt={screen.alt}
                sizes="(min-width: 1024px) 250px, (min-width: 640px) 230px, 60vw"
                className="max-w-[250px] motion-safe:animate-[onward-fade_220ms_ease-out]"
              />
            </div>
            <p className="mt-4 text-center text-[11px] font-medium text-muted">
              Real onWard screen · your work stays private until you choose to share it
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

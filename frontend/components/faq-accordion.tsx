"use client";

import { useId, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({
  items,
  variant = "home",
}: {
  items: FaqItem[];
  variant?: "home" | "pricing";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();
  const homeStyle = variant === "home";

  return (
    <div className="mt-10 divide-y divide-line border-y border-line">
      {items.map(({ question, answer }, index) => {
        const open = openIndex === index;
        const answerId = `${id}-answer-${index}`;

        return (
          <div
            key={question}
            className={homeStyle ? "py-5 sm:py-6" : "py-5"}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={answerId}
              onClick={() => setOpenIndex(open ? null : index)}
              className={`flex w-full cursor-pointer items-center justify-between text-left text-ink ${
                homeStyle
                  ? "gap-5 text-[16px] font-semibold sm:text-[18px]"
                  : "gap-4 text-[15.5px] font-bold tracking-tight"
              }`}
            >
              {question}
              <span
                aria-hidden="true"
                className={`flex shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform ${
                  homeStyle ? "h-8 w-8 text-[20px]" : "h-7 w-7"
                } ${open ? "rotate-45 border-lime-deep text-lime-deep" : ""}`}
              >
                +
              </span>
            </button>
            <div id={answerId} hidden={!open}>
              <p
                className={
                  homeStyle
                    ? "max-w-2xl pr-10 pt-4 text-[14px] leading-relaxed text-muted sm:text-[16px]"
                    : "lead mt-3 max-w-xl text-[14.5px]"
                }
              >
                {answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

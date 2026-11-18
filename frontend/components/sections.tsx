import type { ReactNode } from "react";
import { Check } from "lucide-react";

/* ————— Split feature section ————— */

export function FeatureSplit({
  id,
  eyebrow,
  title,
  body,
  points,
  visual,
  caption,
  reverse = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: ReactNode;
  /** Says out loud what the visual is, so a rendering is never read as a promise. */
  caption?: string;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="container-x py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        <div className={`min-w-0 ${reverse ? "lg:order-2" : ""}`}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h2 mt-4">{title}</h2>
          <p className="lead mt-5 max-w-xl">{body}</p>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-[15px] font-medium text-ink/85"
              >
                <span className="check">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={`min-w-0 ${reverse ? "lg:order-1" : ""}`}>
          {caption ? (
            <figure>
              {visual}
              <figcaption className="tiny mt-4 text-center">{caption}</figcaption>
            </figure>
          ) : (
            visual
          )}
        </div>
      </div>
    </section>
  );
}

/* ————— Light-lime panel wrapper for screen visuals ————— */

export function LimePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] bg-lime-pale p-5 sm:p-8 ${className}`}
    >
      <span className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime/50 blur-[2px]" />
      <span className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-lime-soft" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ————— Full-bleed definition row with hairline dividers ————— */

export function DefinitionRow({
  items,
}: {
  items: { name: string; tagline: string; body: string }[];
}) {
  return (
    <section className="border-y border-line bg-paper">
      <div className="container-x grid gap-px sm:grid-cols-3">
        {items.map((it, i) => (
          <div
            key={it.name}
            className={`py-10 sm:py-14 ${i > 0 ? "sm:border-l sm:border-line sm:pl-10" : ""}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-deep">
              {it.name}
            </p>
            <p className="h3 mt-3">{it.tagline}</p>
            <p className="tiny mt-3 max-w-sm">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

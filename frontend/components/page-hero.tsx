import { Starfield } from "./starfield";

export function PageHero({
  eyebrow,
  badge,
  title,
  subtitle,
}: {
  eyebrow: string;
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-night pb-20 pt-[120px] text-paper sm:pb-24 sm:pt-[150px]">
      <Starfield />
      <span className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
      <div className="container-x relative text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-4 py-1.5 text-[12.5px] font-semibold text-paper/85">
            {eyebrow}
          </span>
          {badge}
        </div>
        <h1 className="h-page mx-auto mt-6 max-w-3xl">{title}</h1>
        {subtitle ? (
          <p className="lead mx-auto mt-5 max-w-2xl text-paper/60">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

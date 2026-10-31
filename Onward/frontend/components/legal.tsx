import Link from "next/link";
import { PageHero } from "./page-hero";

export type LegalSection = {
  id: string;
  heading: string;
  body: React.ReactNode;
};

export function LegalLayout({
  eyebrow,
  title,
  subtitle,
  updated,
  preamble,
  sections,
}: {
  eyebrow: string;
  title: string;
  subtitle: React.ReactNode;
  updated: string;
  preamble: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="container-x py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
              On this page
            </p>
            <ol className="mt-4 space-y-2.5 border-l border-line pl-4">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[13.5px] leading-snug text-muted transition hover:text-ink"
                  >
                    <span className="mr-1.5 font-bold text-lime-deep">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          {/* Body */}
          <article className="max-w-2xl">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-lime-deep">
              Last updated: {updated}
            </p>
            <div className="lead mt-4 text-[15px]">{preamble}</div>

            <div className="mt-10 space-y-10">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="h3 text-[20px] text-ink">
                    <span className="mr-2 text-lime-deep">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/75">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-line bg-mist p-6">
              <p className="text-[15px] font-bold text-ink">
                Questions about this document?
              </p>
              <p className="mt-1.5 text-[14px] text-muted">
                Write to us and a human at GIGS Labs will read it.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-dark">
                  Contact GIGS Labs
                </Link>
                <a href="mailto:privacy@gigslabs.example" className="btn-ghost">
                  privacy@gigslabs.example
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

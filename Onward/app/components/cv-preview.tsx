"use client";

import { monthYear, type CvModel } from "@/lib/cv";

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="border-b border-line pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
        {title}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function CvPreview({ cv }: { cv: CvModel }) {
  const contacts = [
    cv.email,
    cv.phone,
    cv.location,
    ...cv.links.map((link) => (link.label ? `${link.label}: ${link.url}` : link.url)),
  ].filter(Boolean);

  return (
    <article className="mx-auto min-h-[720px] w-full max-w-[620px] bg-white px-6 py-7 text-ink shadow-[0_12px_42px_rgba(16,17,8,0.12)] ring-1 ring-line sm:px-10 sm:py-10">
      <header className="border-b-2 border-lime-deep pb-4">
        <h2 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
          {cv.name || "Your name"}
        </h2>
        {cv.headline ? (
          <p className="mt-1 text-[12px] font-semibold text-inksoft">{cv.headline}</p>
        ) : null}
        {contacts.length ? (
          <p className="mt-2 text-[9px] leading-[1.6] text-muted">{contacts.join(" · ")}</p>
        ) : null}
      </header>

      {cv.summary ? (
        <PreviewSection title="Profile">
          <p className="whitespace-pre-line text-[10px] leading-[1.65] text-inksoft">
            {cv.summary}
          </p>
        </PreviewSection>
      ) : null}

      {cv.experience.length ? (
        <PreviewSection title="Experience">
          <div className="space-y-4">
            {cv.experience.map((entry) => (
              <article key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-[10.5px] font-bold text-ink">
                      {[entry.role, entry.project].filter(Boolean).join(" · ") || "Role"}
                    </h4>
                    {entry.location ? (
                      <p className="mt-0.5 text-[8.5px] text-muted">{entry.location}</p>
                    ) : null}
                  </div>
                  {entry.period ? (
                    <span className="shrink-0 text-[8px] text-muted">{entry.period}</span>
                  ) : null}
                </div>
                {entry.bullets.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {entry.bullets.map((line, index) => (
                      <li
                        key={`${entry.id}:${index}`}
                        className="flex gap-2 text-[9px] leading-[1.55] text-inksoft"
                      >
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-lime-deep" />
                        <span className="whitespace-pre-line">{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {entry.skills.length ? (
                  <p className="mt-1 text-[8.5px] leading-[1.5] text-muted">
                    Skills: {entry.skills.join(", ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {cv.skills.length ? (
        <PreviewSection title="Digital Skills and Skills">
          <p className="text-[9.5px] leading-[1.65] text-inksoft">
            {cv.skills.map((skill) => skill.name).join(" · ")}
          </p>
        </PreviewSection>
      ) : null}

      {cv.certifications.length ? (
        <PreviewSection title="Training and Certifications">
          <div className="space-y-3">
            {cv.certifications.map((item) => (
              <article key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-[9.5px] font-bold text-ink">{item.title}</h4>
                  {item.date ? (
                    <span className="shrink-0 text-[8px] text-muted">{item.date}</span>
                  ) : null}
                </div>
                {item.issuer ? (
                  <p className="mt-0.5 text-[8.5px] text-muted">{item.issuer}</p>
                ) : null}
                {item.note ? (
                  <p className="mt-1 whitespace-pre-line text-[9px] leading-[1.55] text-inksoft">
                    {item.note}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {cv.education.length ? (
        <PreviewSection title="Education">
          <div className="space-y-3">
            {cv.education.map((item, index) => {
              const period = item.start
                ? `${monthYear(item.start)} - ${item.end ? monthYear(item.end) : "Present"}`
                : item.end
                  ? monthYear(item.end)
                  : "";
              return (
                <article key={`${item.school}:${index}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[9.5px] font-bold text-ink">
                      {[item.award, item.school].filter(Boolean).join(" · ")}
                    </h4>
                    {period ? (
                      <span className="shrink-0 text-[8px] text-muted">{period}</span>
                    ) : null}
                  </div>
                  {item.note ? (
                    <p className="mt-1 whitespace-pre-line text-[9px] leading-[1.55] text-inksoft">
                      {item.note}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </PreviewSection>
      ) : null}
    </article>
  );
}

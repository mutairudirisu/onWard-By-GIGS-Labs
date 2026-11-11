"use client";

import { monthYear, type CvModel, type CvTemplateId } from "@/lib/cv";

const TEMPLATE_STYLE: Record<
  CvTemplateId,
  { accent: string; heading: string; header: string; title: string; article: string }
> = {
  classic: {
    accent: "bg-[#789b2c]",
    heading: "text-[#526d20]",
    header: "border-b-2 border-[#789b2c]",
    title: "text-ink",
    article: "font-sans",
  },
  modern: {
    accent: "bg-[#21718b]",
    heading: "text-[#1e647c]",
    header: "border-b border-[#21718b]",
    title: "text-ink",
    article: "font-sans",
  },
  executive: {
    accent: "bg-[#375783]",
    heading: "text-[#28476f]",
    header: "bg-[#172b46] text-white",
    title: "text-white",
    article: "font-sans",
  },
  elegant: {
    accent: "bg-[#8a5878]",
    heading: "text-[#754763]",
    header: "border-b-2 border-double border-[#8a5878]",
    title: "text-ink",
    article: "font-serif",
  },
};

function PreviewSection({
  title,
  children,
  template,
}: {
  title: string;
  children: React.ReactNode;
  template: CvTemplateId;
}) {
  const style = TEMPLATE_STYLE[template];
  return (
    <section className="mt-5">
      <h3 className={`flex items-center gap-2 border-b border-line pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${style.heading}`}>
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        {title}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function CvPreview({
  cv,
  template = "classic",
}: {
  cv: CvModel;
  template?: CvTemplateId;
}) {
  const style = TEMPLATE_STYLE[template];
  const contacts = [
    cv.email,
    cv.phone,
    cv.location,
    ...cv.links.map((link) => (link.label ? `${link.label}: ${link.url}` : link.url)),
  ].filter(Boolean);

  return (
    <article
      id="cv-print-target"
      className={`cv-preview-paper mx-auto min-h-[720px] w-full max-w-[620px] bg-white px-6 py-7 text-ink shadow-[0_12px_42px_rgba(16,17,8,0.12)] ring-1 ring-line sm:px-10 sm:py-10 ${style.article}`}
    >
      <header
        className={`pb-4 ${style.header} ${
          template === "executive"
            ? "-mx-6 -mt-7 mb-4 px-6 pt-7 sm:-mx-10 sm:-mt-10 sm:px-10 sm:pt-10"
            : ""
        }`}
      >
        <h2 className={`text-[24px] font-bold leading-tight tracking-tight ${style.title}`}>
          {cv.name || "Your name"}
        </h2>
        {cv.headline ? (
          <p className={`mt-1 text-[12px] font-semibold ${template === "executive" ? "text-white/80" : "text-inksoft"}`}>
            {cv.headline}
          </p>
        ) : null}
        {contacts.length ? (
          <p className={`mt-2 text-[9px] leading-[1.6] ${template === "executive" ? "text-white/70" : "text-muted"}`}>
            {contacts.join(" · ")}
          </p>
        ) : null}
      </header>

      {cv.summary ? (
        <PreviewSection title="Profile" template={template}>
          <p className="whitespace-pre-line text-[10px] leading-[1.65] text-inksoft">
            {cv.summary}
          </p>
        </PreviewSection>
      ) : null}

      {cv.experience.length ? (
        <PreviewSection title="Experience" template={template}>
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
        <PreviewSection title="Digital Skills and Skills" template={template}>
          <p className="text-[9.5px] leading-[1.65] text-inksoft">
            {cv.skills.map((skill) => skill.name).join(" · ")}
          </p>
        </PreviewSection>
      ) : null}

      {cv.certifications.length ? (
        <PreviewSection title="Training and Certifications" template={template}>
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
        <PreviewSection title="Education" template={template}>
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

import { Check } from "lucide-react";

const NOTES = [
  {
    location: "uk london",
    lead: "It makes my wins sound as good as they actually are.",
    body: "I am terrible at bragging. onWard keeps the receipts so my portfolio speaks before I do.",
    name: "Kim",
    role: "Junior Product Designer",
    tilt: "-rotate-2",
  },
  {
    location: "qa doha",
    lead: "This could help me keep going.",
    body: "I am learning machine learning across three fields by myself. Some days it feels like nothing. The timeline proved otherwise.",
    name: "Bello",
    role: "ML Engineer",
    tilt: "rotate-1",
  },
  {
    location: "us new york",
    lead: "The application is a great idea.",
    body: "Perfect for anyone who forgets to document small wins, contributions and fixes through the day. They add up — now I can see them.",
    name: "Abebat",
    role: "Project Manager",
    tilt: "-rotate-1",
  },
];

export function Testimonials() {
  return (
    <section className="bg-mist py-20 lg:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">From people using it</p>
          <h2 className="h2 mt-4">In their words.</h2>
          <p className="lead mt-5">
            Real growth, logged in the margins of busy days.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
          {NOTES.map((n) => (
            <figure
              key={n.name}
              className={`flex flex-col rounded-[20px] border border-line bg-paper p-6 shadow-lift transition-transform duration-300 hover:rotate-0 ${n.tilt} ${
                n.name === "Bello" ? "md:translate-y-6" : ""
              }`}
            >
              <div className="flex items-center justify-between border-b border-dashed border-line pb-4">
                <span className="text-[13px] font-bold tracking-tight text-ink">
                  <span className="text-lime-deep">o</span>nWard
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">
                  {n.location}
                </span>
              </div>
              <blockquote className="flex-1 pt-4 text-[13.5px] leading-relaxed text-ink/75">
                <span className="font-bold text-ink">&ldquo;{n.lead}&rdquo;</span>{" "}
                {n.body}
              </blockquote>
              <figcaption className="mt-5 flex items-end justify-between border-t border-dashed border-line pt-4">
                <div>
                  <p className="text-[12.5px] font-bold text-ink">{n.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted">
                    {n.role}
                  </p>
                </div>
                <span
                  aria-label="Verified onWard user"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2F4A28] text-paper"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

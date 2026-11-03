import type { Metadata } from "next";
import {
  Clock,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Send,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import { APP_URL, emailFor } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — GIGS Labs",
  description:
    "Get in touch with GIGS Labs, the makers of onWard. Support, press, careers and general enquiries — a real person reads every message.",
};

const CHANNELS = [
  {
    icon: Mail,
    label: "General enquiries",
    email: emailFor("hello"),
    blurb: "Questions, ideas, feedback, partnerships.",
  },
  {
    icon: LifeBuoy,
    label: "Product support",
    email: emailFor("support"),
    blurb: "Something broken or confusing in the app.",
  },
  {
    icon: Newspaper,
    label: "Press & media",
    email: emailFor("press"),
    blurb: "Interviews, fact checks, the press kit.",
  },
  {
    icon: Users,
    label: "Careers",
    email: emailFor("careers"),
    blurb: "Roles are coming soon — say hi meanwhile.",
  },
];

export default function Contact() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Talk to GIGS Labs."
        subtitle="We are a small team, so messages reach a founder, not a queue. Pick the right mailbox or send us a note — either way, a human reads it."
      />

      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left: channels + details */}
          <div>
            <h2 className="h3 text-[22px]">Direct lines.</h2>
            <p className="tiny mt-2">
              Email is the fastest way to reach the right person.
            </p>
            <div className="mt-6 space-y-3">
              {CHANNELS.map((c) => (
                <a
                  key={c.email}
                  href={`mailto:${c.email}`}
                  className="group flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 transition hover:border-lime-deep/50 hover:shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep">
                    <c.icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-ink">
                        {c.label}
                      </span>
                      <Send className="h-3.5 w-3.5 text-faint transition group-hover:text-lime-deep" />
                    </span>
                    <span className="mt-0.5 block break-all text-[13.5px] font-medium text-lime-deep">
                      {c.email}
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">
                      {c.blurb}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-mist p-5">
                <MapPin className="h-5 w-5 text-lime-deep" />
                <p className="mt-3 text-[14px] font-bold text-ink">Where we are</p>
                <p className="mt-1 text-[13px] text-muted">
                  Lagos, Nigeria — and remote everywhere.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-mist p-5">
                <Clock className="h-5 w-5 text-lime-deep" />
                <p className="mt-3 text-[14px] font-bold text-ink">Response time</p>
                <p className="mt-1 text-[13px] text-muted">
                  Within one business day, WAT hours.
                </p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <h2 className="h3 text-[22px]">Or send a message.</h2>
            <p className="tiny mt-2">
              This opens your own email app with everything filled in — nothing
              is stored on this page.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ————— What happens next ————— */}
      <section className="bg-mist py-16 lg:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What happens next</p>
            <h2 className="h2 mt-4">No bots, no ticket numbers.</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
            {[
              ["1", "A founder reads it", "Every message lands with someone who builds onWard."],
              ["2", "We reply in a day", "Usually sooner. If we need time, we say so up front."],
              ["3", "It goes somewhere", "Feedback shapes the roadmap — you can follow what ships."],
            ].map(([n, t, b]) => (
              <div
                key={n}
                className="rounded-2xl border border-line bg-paper p-6 shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-[15px] font-bold text-ink">
                  {n}
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {b}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center">
            <a
              href={APP_URL}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink transition hover:text-lime-deep"
            >
              <MessageCircle className="h-4 w-4" />
              Already an onWard user? Report it from inside the app.
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

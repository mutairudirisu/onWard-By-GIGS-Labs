import type { Metadata } from "next";
import { Download, Mail, MessageSquareQuote } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ProductPhone } from "@/components/product-phone";
import { CopyButton } from "@/components/copy-button";
import { ColorSwatches } from "@/components/color-swatches";
import { emailFor, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Press kit — GIGS Labs",
  description:
    "onWard press kit: logos, brand colours, product screenshots, boilerplate and press contact for GIGS Labs.",
};

const BOILERPLATE =
  "onWard is a work-documentation app from GIGS Labs, a young Nigerian software studio. It turns the wins, lessons, milestones and feedback of an ordinary week into a dated record of what you did — and compiles the ones that matter into a portfolio page, with a PDF you can send to a manager, an appraiser or a hiring team. onWard installs from the browser on iOS, Android and desktop; there is no app store to go through.";

const FACTS: [string, string][] = [
  ["Company", "GIGS Labs"],
  ["Product", "onWard"],
  ["Founded", "2026"],
  ["Headquarters", "Lagos, Nigeria"],
  ["Category", "Productivity · Work documentation"],
  ["Platforms", "Web PWA — installs on iOS, Android and desktop"],
  ["Pricing", "Free plan; Pro from ₦1,500/mo (₦750 for students)"],
  ["Website", "getonward.vercel.app"],
];

const LOGOS = [
  ["onWard logo", "/press/onward-logo.svg", "Full wordmark · for light backgrounds"],
  ["onWard logo (light)", "/press/onward-logo-light.svg", "Full wordmark · for dark backgrounds"],
  ["onWard mark", "/press/onward-mark.svg", "Icon only · lime on ink"],
  ["onWard mark (dark)", "/press/onward-mark-ink.svg", "Icon only · lime on dark"],
];

const COLORS: [string, string, string][] = [
  ["Lime", "#C9F24E", "text-ink"],
  ["Lime deep", "#B4E13A", "text-ink"],
  ["Lime soft", "#EDFBC6", "text-ink"],
  ["Ink", "#101108", "text-paper"],
  ["Dark", "#20211A", "text-paper"],
  ["Night", "#0C0D08", "text-paper"],
  ["Cream", "#F7F7F2", "text-ink"],
  ["Muted", "#86877B", "text-paper"],
];

const SHOTS = [
  { label: "Home · light theme", src: "/app-screens/home-light.jpg" },
  { label: "Home · dark theme", src: "/app-screens/home-dark.jpg" },
  { label: "onWards timeline", src: "/app-screens/onwards-light.jpg" },
  { label: "Exchange · light theme", src: "/app-screens/exchange-light.jpg" },
  { label: "Exchange · dark theme", src: "/app-screens/exchange-dark.jpg" },
  { label: "My Network · light theme", src: "/app-screens/network-light.jpg" },
  { label: "My Network · dark theme", src: "/app-screens/network-dark.jpg" },
];

export default function Press() {
  return (
    <main>
      <PageHero
        eyebrow="Press kit"
        title="Everything you need to write about onWard."
        subtitle="Logos, colours, screenshots and boilerplate — free to use for accurate editorial coverage. Just keep it honest, and tell us before you publish if you can."
      />

      {/* ————— Logos ————— */}
      <section className="container-x py-16 lg:py-24">
        <p className="eyebrow">Brand assets</p>
        <h2 className="h2 mt-4 max-w-lg">Logos, ready to download.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {LOGOS.map(([name, href, note]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5 shadow-card"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                    href.includes("light") ? "bg-night" : "bg-mist"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={href}
                    alt={`${name} preview`}
                    className={href.includes("mark") ? "h-8 w-8" : "h-7 w-auto"}
                  />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-ink">{name}</p>
                  <p className="text-[12.5px] text-muted">{note}</p>
                </div>
              </div>
              <a
                href={href}
                download
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12.5px] font-bold text-ink transition hover:border-ink/30"
              >
                <Download className="h-3.5 w-3.5" /> SVG
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ————— Colours + boilerplate ————— */}
      <section className="bg-mist py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Palette</p>
            <h2 className="h3 mt-4 text-[22px]">onWard colours.</h2>
            <p className="tiny mt-2">
              Tap any swatch to copy its hex. Lime is the accent — never let it
              sit on a busy background.
            </p>
            <ColorSwatches colors={COLORS} />
          </div>

          <div>
            <p className="eyebrow">Boilerplate</p>
            <h2 className="h3 mt-4 text-[22px]">Copy &amp; paste, verbatim.</h2>
            <div className="mt-6 rounded-2xl border border-line bg-paper p-6 shadow-card">
              <MessageSquareQuote className="h-6 w-6 text-lime-deep" />
              <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
                {BOILERPLATE}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="text-[12px] font-bold uppercase tracking-wide text-faint">
                  About GIGS Labs · onWard
                </span>
                <CopyButton text={BOILERPLATE} label="Copy boilerplate" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Fact sheet ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Quick facts</p>
            <h2 className="h2 mt-4 max-w-sm">The one-line version of us.</h2>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {FACTS.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-6 py-3.5"
                >
                  <dt className="text-[13.5px] text-muted">{k}</dt>
                  <dd className="text-right text-[14.5px] font-semibold text-ink">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="eyebrow">Guidelines</p>
            <h2 className="h2 mt-4 max-w-sm">Please do, please don&apos;t.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-[14px] font-bold text-ink">Do</p>
                <ul className="mt-3 space-y-2 text-[13.5px] text-muted">
                  <li>Use the official logos unchanged.</li>
                  <li>Keep the lowercase “o” in lime.</li>
                  <li>Give onWard a clear, legible size.</li>
                  <li>Link to getonward.vercel.app when publishing.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-[14px] font-bold text-ink">Don&apos;t</p>
                <ul className="mt-3 space-y-2 text-[13.5px] text-muted">
                  <li>Recolour, rotate or restyle the mark.</li>
                  <li>Write it as “OnWard” or “onward”.</li>
                  <li>Cram the logo into low-contrast spots.</li>
                  <li>Imply endorsement we haven&apos;t given.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Screenshots ————— */}
      <section className="bg-night py-16 text-paper lg:py-24">
        <div className="container-x">
          <p className="eyebrow text-lime">Screenshots</p>
          <h2 className="h2 mt-4 max-w-lg text-paper">onWard, on the phone.</h2>
          <p className="lead mt-4 max-w-lg text-paper/55">
            Current onWard screens in light and dark themes. Tap any phone to
            open the full-size image.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SHOTS.map(({ label, src }) => (
              <a
                key={label}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                <ProductPhone
                  src={src}
                  alt={`onWard ${label} screen`}
                  compact
                  sizes="(min-width: 1024px) 140px, (min-width: 640px) 180px, 42vw"
                  className="max-w-[180px] transition group-hover:scale-[1.03]"
                />
                <p className="mt-2.5 text-[12.5px] font-semibold text-paper/70">
                  {label}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Press contact ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="flex flex-col items-center gap-5 rounded-[36px] border border-line bg-lime-pale px-8 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Mail className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h2 className="h2 max-w-xl text-[26px] sm:text-[34px]">
            Interview request? Fact check? Just ask.
          </h2>
          <p className="lead mx-auto max-w-md text-[15px]">
            A founder answers press email directly — usually within a day.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <a href={mailto("press")} className="btn-dark">
              {emailFor("press")}
            </a>
            <a href="/press/onward-logo.svg" download className="btn-ghost">
              <Download className="h-4 w-4" /> Download logo pack
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { APP_URL, LOGIN_URL } from "@/lib/site";
import { FooterWordmark } from "./footer-wordmark";
import { LogoMark } from "./logo";

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Built for your role", href: "/#audiences" },
      { label: "Pricing", href: "/pricing" },
      { label: "Get onWard", href: APP_URL, external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About GIGS Labs", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press kit", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "#" },
      { label: "Growth playbook", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "For employers", href: "/#audiences" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "Log in", href: LOGIN_URL, external: true },
    ],
  },
];

/** Link with a soft blurred copy of its own label behind it — lights up on hover. */
function FooterNavItem({ label, href, external }: FooterLink) {
  const cls =
    "group relative inline-block text-[14px] text-paper/50 transition-colors duration-300 hover:text-paper";
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 whitespace-nowrap text-lime opacity-0 blur-[7px] transition-opacity duration-300 group-hover:opacity-80"
      >
        {label}
      </span>
      <span className="relative">{label}</span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-night text-paper">
      <div className="container-x pt-16 lg:pt-24">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:gap-x-10">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[14px] font-semibold text-paper/90">{col.title}</p>
              <ul className="mt-5 space-y-3.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterNavItem {...l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x mt-16 flex flex-col items-center lg:mt-24">
        <span className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute h-24 w-24 rounded-full bg-lime/25 blur-[34px]"
          />
          <LogoMark dark className="relative h-11 w-11 drop-shadow-[0_0_16px_rgba(201,242,78,0.45)]" />
        </span>
        <p className="mt-6 text-[13px] text-paper/45">
          © 2026 onWard · A GIGS Labs product
        </p>
      </div>

      <FooterWordmark />
    </footer>
  );
}

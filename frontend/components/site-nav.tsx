"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { APP_INSTALL_URL, LOGIN_URL } from "@/lib/site";
import { Logo } from "./logo";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "For students", href: "/#students" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const isHome = usePathname() === "/";

  return (
    <header
      className={`fixed inset-x-0 z-40 ${isHome ? "top-10" : "top-2"}`}
    >
      <div className="container-x">
        <div className="mx-auto flex h-14 max-w-[1060px] items-center justify-between rounded-full border border-line/80 bg-paper/95 px-3 shadow-[0_12px_42px_rgba(16,17,8,0.10)] backdrop-blur-md sm:px-5">
          <Link href="/" aria-label="onWard home" className="flex shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 md:flex lg:gap-7">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[14px] font-medium text-ink/70 transition hover:text-lime-deep"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={LOGIN_URL}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-semibold text-ink transition hover:bg-mist sm:inline-flex"
            >
              Log in
            </a>
            <a
              href={APP_INSTALL_URL}
              className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-ink px-2 py-2 text-[10px] font-semibold text-paper transition hover:bg-dark sm:gap-1.5 sm:px-5 sm:text-[14px]"
              aria-label="Get onWard — open the app installation instructions"
            >
              Get onWard
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.2} />
            </a>
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink transition hover:bg-mist md:hidden"
            >
              {open ? (
                <X className="h-5 w-5" strokeWidth={2.2} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="mx-auto mt-2 max-w-[1060px] rounded-3xl border border-line bg-paper px-5 pb-5 pt-1 shadow-card md:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-line/70 py-3.5 text-[15px] font-medium text-ink last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={LOGIN_URL}
              onClick={() => setOpen(false)}
              className="mt-3 block text-[15px] font-semibold text-ink/70"
            >
              Log in
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

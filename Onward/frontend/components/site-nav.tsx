"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { APP_URL, LOGIN_URL } from "@/lib/site";
import { Logo } from "./logo";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "For students", href: "/#students" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The sheet is only opaque on paper; over the dark hero it needs the solid bar.
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition ${
        solid
          ? "border-b border-line/70 bg-paper/95 lg:bg-paper/85 lg:backdrop-blur-md"
          : ""
      }`}
    >
      <div className="container-x flex h-[68px] items-center justify-between">
        <Link href="/" aria-label="onWard home" className="flex">
          <Logo dark={!solid} />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-[14px] font-medium transition hover:text-lime-deep ${
                solid ? "text-ink/70" : "text-paper/80 hover:text-lime"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={LOGIN_URL}
            className={`hidden items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition sm:inline-flex ${
              solid
                ? "text-ink hover:bg-mist"
                : "text-paper/85 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            Log in
          </a>
          <a
            href={APP_URL}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-semibold transition sm:px-5 ${
              solid
                ? "bg-ink text-paper hover:bg-dark"
                : "bg-lime text-ink hover:bg-lime-deep"
            }`}
          >
            Get onWard
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition md:hidden ${
              solid
                ? "border-line text-ink hover:bg-mist"
                : "border-paper/20 text-paper hover:border-lime hover:text-lime"
            }`}
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
        <nav className="border-t border-line bg-paper px-5 pb-5 pt-1 md:hidden">
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
    </header>
  );
}

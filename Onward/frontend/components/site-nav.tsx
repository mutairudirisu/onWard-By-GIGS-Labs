"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LOGIN_URL } from "@/lib/site";
import { Logo } from "./logo";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition ${
        scrolled ? "border-b border-line/70 bg-paper/85 backdrop-blur-md" : ""
      }`}
    >
      <div className="container-x flex h-[68px] items-center justify-between">
        <Link href="/" aria-label="onWard home" className="flex">
          <Logo dark={!scrolled} />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-[14px] font-medium transition hover:text-lime-deep ${
                scrolled ? "text-ink/70" : "text-paper/80 hover:text-lime"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={LOGIN_URL}
            className={`hidden items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition sm:inline-flex ${
              scrolled
                ? "text-ink hover:bg-mist"
                : "text-paper/85 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            Log in
          </a>
          <Link
            href="/pricing"
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold transition ${
              scrolled
                ? "bg-ink text-paper hover:bg-dark"
                : "bg-lime text-ink hover:bg-lime-deep"
            }`}
          >
            Get onWard
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </header>
  );
}

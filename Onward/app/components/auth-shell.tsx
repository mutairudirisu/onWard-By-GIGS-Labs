import type { ReactNode } from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { HomeIndicator } from "./phone-shell";
import { Wordmark } from "./wordmark";

/**
 * Auth layout. Mobile (PWA): a single centred column, like the rest of the app.
 * Desktop (lg+): a full-bleed dark split — glowing brand panel on the left, the
 * form on the right.
 */
export function AuthShell({
  children,
  quote = "A record of your work, built one small step at a time.",
}: {
  children: ReactNode;
  quote?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:bg-night">
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:px-14 lg:py-12 xl:px-[84px] xl:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 85% at 0% 104%, rgba(201,242,78,0.9) 0%, rgba(150,190,45,0.5) 20%, rgba(66,82,24,0.4) 44%, rgba(12,13,8,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-28 h-[380px] w-[480px] rounded-full bg-lime/35 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.8) 1.1px, transparent 1.3px)",
            backgroundSize: "54px 54px",
            opacity: 0.32,
            maskImage: "linear-gradient(to bottom, black, transparent 58%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 58%)",
          }}
        />

        <Link href="/" className="relative flex w-fit items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime">
            <Sprout className="h-5 w-5 text-ink" strokeWidth={2.2} />
          </span>
          <Wordmark tone="paper" className="text-[19px]" />
        </Link>

        <p className="relative mb-24 mt-auto max-w-[20ch] self-center text-balance text-center font-serif text-[clamp(29px,2.6vw,43px)] leading-[1.16] tracking-[-0.01em] text-paper xl:mb-32">
          {quote}
        </p>
      </aside>

      <div className="relative flex flex-1 flex-col px-5 pb-4 pt-5 lg:bg-night lg:px-16 lg:py-12 xl:px-24">
        <div className="auth-panel mx-auto flex w-full max-w-[400px] flex-1 flex-col lg:max-w-[430px] lg:justify-center">
          {children}
        </div>
        <p className="mt-8 hidden text-center text-[11px] text-paper/30 lg:block">
          © 2026 onWard · A GIGS Labs product
        </p>
        <div className="lg:hidden">
          <HomeIndicator />
        </div>
      </div>
    </div>
  );
}

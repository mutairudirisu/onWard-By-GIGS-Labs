import type { ReactNode } from "react";
import { BottomNav, type TabId } from "./bottom-nav";
import { Wordmark } from "./wordmark";

export function HomeIndicator() {
  return (
    <div className="flex justify-center pb-2 pt-3">
      <span className="h-[5px] w-32 rounded-full bg-ink" />
    </div>
  );
}

export function PhoneShell({
  children,
  tab,
  indicator = true,
  wide = false,
}: {
  children: ReactNode;
  tab?: TabId;
  indicator?: boolean;
  wide?: boolean;
}) {
  const showNav = Boolean(tab);
  const hasFooter = showNav || indicator;

  return (
    <div className="flex min-h-dvh flex-col">
      <main
        className={`flex-1 px-5 pt-5 md:px-8 md:pt-8 lg:px-10 lg:pt-10 xl:px-14 ${
          showNav ? "pb-36 md:pb-12" : indicator ? "pb-16 md:pb-12" : "pb-6"
        }`}
      >
        <div
          className={`mx-auto w-full max-w-none md:max-w-[680px] lg:max-w-[820px] ${
            wide ? "xl:max-w-[1180px] 2xl:max-w-[1320px]" : "xl:max-w-[900px]"
          }`}
        >
          {children}
        </div>
      </main>
      {hasFooter ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[400px] bg-cream md:hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-cream via-cream/70 to-transparent" />
          {showNav ? <BottomNav active={tab!} /> : null}
          {indicator ? <HomeIndicator /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function AuthHeader({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="mb-7 flex items-center gap-3 lg:hidden">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 5 8 12l7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Wordmark className="text-[15px]" />
    </a>
  );
}

import { Sprout } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "./wordmark";

/** Google's multicolour "G" for the social auth button. */
export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.9 11.9 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.7l3.8-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7L19.7 3A11.9 11.9 0 0 0 1.8 7.1l3.8 3c.9-2.7 3.4-5.3 6.4-5.3Z"
      />
    </svg>
  );
}

/** Lime app-icon tile with the onWard sprout — the auth brand mark. */
export function AuthBrand({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const tile = size === "md" ? "h-8 w-8 rounded-xl" : "h-7 w-7 rounded-lg";
  const glyph = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className={`flex ${tile} items-center justify-center bg-lime shadow-card`}>
        <Sprout className={`${glyph} text-dark`} strokeWidth={2.2} />
      </span>
      <Wordmark className={size === "md" ? "text-[17px]" : "text-[15px]"} />
    </span>
  );
}

/** Back link used at the very top of the secondary auth screens. */
export function AuthBack({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[12px] font-semibold text-inksoft transition hover:bg-lime-pale"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

/** A dotted rule with a sprout node at its centre — the recurring "dots" motif. */
export function SproutDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-0 flex-1 border-t-2 border-dotted border-dash" />
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dotted border-lime-deep">
        <Sprout className="h-3 w-3 text-lime-deep" strokeWidth={2.4} />
      </span>
      <span className="h-0 flex-1 border-t-2 border-dotted border-dash" />
    </div>
  );
}

/** A soft field of lime dots that fades downward — topside texture for auth screens. */
export function DotField({
  className = "",
  color = "#B4E13A",
  gap = 13,
  size = 2,
}: {
  className?: string;
  color?: string;
  gap?: number;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(${color} ${size}px, transparent ${size + 0.4}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        opacity: 0.5,
        maskImage: "linear-gradient(to bottom, black, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
      }}
    />
  );
}

/** Shared header for the step auth screens: back link, brand, dotted divider. */
export function AuthTop({
  backHref = "/",
  className = "",
}: {
  backHref?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <DotField className="absolute -top-5 left-0 h-20 w-full" />
      <div className="relative">
        <AuthBack href={backHref} />
        <AuthBrand className="mt-4" />
        <SproutDivider className="mt-5 mb-6" />
      </div>
    </div>
  );
}

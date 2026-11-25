"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useSmartBack } from "@/components/providers/navigation-history";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "dark";
  href?: string;
  icon?: ReactNode;
  iconLeft?: ReactNode;
  full?: boolean;
};

export function Button({
  variant = "primary",
  href,
  icon,
  iconLeft,
  full = true,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base = [
    "flex items-center justify-center gap-2 rounded-btn px-4 py-3 text-[13px] font-semibold transition active:scale-[0.99]",
    variant === "primary" ? "bg-lime text-dark hover:bg-lime-deep" : "",
    variant === "secondary" ? "border border-line bg-paper text-ink hover:bg-cream" : "",
    variant === "quiet" ? "text-muted hover:text-ink" : "",
    variant === "dark" ? "bg-ink text-paper hover:brightness-125" : "",
    full ? "w-full" : "",
    className,
  ].join(" ");

  const inner = (
    <>
      {iconLeft}
      {children}
      {icon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={base} {...rest}>
      {inner}
    </button>
  );
}

export function ArrowIcon() {
  return <ArrowRight className="h-4 w-4" strokeWidth={2.2} />;
}

export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  uppercase,
}: {
  label: string;
  children: ReactNode;
  uppercase?: boolean;
}) {
  return (
    <div>
      <span
        className={
          uppercase
            ? "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
            : "label"
        }
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function TextInput({
  trailing,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { trailing?: ReactNode }) {
  if (trailing) {
    return (
      <div className="relative">
        <input className={`field-input pr-10 ${className}`} {...rest} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{trailing}</span>
      </div>
    );
  }
  return <input className={`field-input ${className}`} {...rest} />;
}

export function TextArea({
  trailing,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { trailing?: ReactNode }) {
  const box = (
    <textarea
      className={`field-input min-h-[84px] resize-none leading-[1.5] ${
        trailing ? "pr-11" : ""
      } ${className}`}
      {...rest}
    />
  );
  if (!trailing) return box;
  return (
    <div className="relative">
      {box}
      <span className="absolute right-2 bottom-2 text-muted">{trailing}</span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${
        checked ? "bg-lime" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
      <span
        className={`absolute top-1/2 -translate-y-1/2 text-[8px] font-bold ${
          checked ? "left-1.5 text-ink" : "right-1.5 text-muted"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

export function Chip({
  active,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`chip transition hover:border-dash ${active ? "chip-active" : "bg-transparent"} ${className}`}
      {...rest}
    />
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export function SectionRow({
  title,
  accessory,
}: {
  title: string;
  accessory?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-end justify-between">
      <h2 className="text-[13px] font-bold tracking-tight text-ink">{title}</h2>
      {accessory ? <span className="text-[10px] font-semibold text-muted">{accessory}</span> : null}
    </div>
  );
}

export function ScreenHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {left}
        <h1 className="text-[19px] font-bold tracking-tight text-ink">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 lg:mb-8">
      {eyebrow ? <p className="eyebrow col-span-2 mb-1">{eyebrow}</p> : null}
      <h1 className="col-start-1 row-start-2 self-center text-[22px] font-bold leading-tight tracking-tight text-ink lg:text-[30px]">
        {title}
      </h1>
      {actions ? (
        <div className="col-start-2 row-start-2 flex shrink-0 items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
      {subtitle ? (
        <p className="col-start-1 row-start-3 mt-1 max-w-[42ch] text-[13px] leading-[1.45] text-muted lg:text-[15px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function NewButton({
  onClick,
  href,
  children = "New",
}: {
  onClick?: () => void;
  href?: string;
  children?: ReactNode;
}) {
  const cls =
    "flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-2 text-[13px] font-bold text-dark transition hover:bg-lime-deep active:scale-[0.98] lg:px-4 lg:py-2.5 lg:text-[14px]";
  const inner = (
    <>
      <Plus className="h-4 w-4" strokeWidth={2.6} />
      {children}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function BackLink({
  href,
  label,
  onClick,
  className = "",
  children,
}: {
  href: string;
  label: string;
  /** Replaces the navigation when leaving has to save something first. */
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const smartBack = useSmartBack(href);
  const arrow = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const classes =
    className || "-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-inksoft hover:bg-cream";
  if (onClick) {
    return (
      <button type="button" aria-label={label} onClick={onClick} className={classes}>
        {children ?? arrow}
      </button>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={smartBack} className={classes}>
      {children ?? arrow}
    </button>
  );
}

export function BackButton({
  label = "Go back",
  fallback,
}: {
  label?: string;
  fallback?: string;
}) {
  const smartBack = useSmartBack(fallback);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={smartBack}
      className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-inksoft hover:bg-cream"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function Divider({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      {children ? <span className="text-[10px] font-medium text-faint">{children}</span> : null}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}>
      <div className="h-full rounded-full bg-lime" style={{ width: `${value}%` }} />
    </div>
  );
}

export function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#3A3B30" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#C9F24E"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-on-panel">
        {label}
      </span>
    </div>
  );
}

export function FileRow({
  name,
  meta,
}: {
  name: string;
  meta: string;
}) {
  return (
    <div className="card flex items-center gap-3 px-3 py-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream text-inksoft">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-ink">{name}</span>
        <span className="block text-[10px] text-muted">{meta}</span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-muted" aria-hidden>
        <path
          d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

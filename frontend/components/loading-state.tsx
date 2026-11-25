"use client";

import type { HTMLAttributes, ReactNode, SVGProps } from "react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerColor = "primary" | "current" | "muted" | "ink" | "paper";

export type LoadingVariant =
  | "card"       // Clean card container matching onWard's card styling
  | "inline"     // Compact inline row, perfect for buttons, rows, and widgets
  | "page"       // Centered with generous vertical padding for full tab/route loading
  | "overlay"    // Absolute overlay with backdrop blur for forms and busy states
  | "minimal";   // Borderless, transparent centered state

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
  /** Size of the spinner. Defaults to "md" (24px) */
  size?: SpinnerSize;
  /** Color theme for the spinner indicator. Defaults to "primary" */
  color?: SpinnerColor;
  /** Screen reader label. Defaults to "Loading" */
  label?: string;
  className?: string;
}

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

const SPINNER_COLORS: Record<SpinnerColor, { track: string; head: string }> = {
  primary: {
    track: "stroke-line",
    head: "stroke-lime-deep",
  },
  current: {
    track: "opacity-25 stroke-current",
    head: "stroke-current",
  },
  muted: {
    track: "stroke-line",
    head: "stroke-muted",
  },
  ink: {
    track: "stroke-line",
    head: "stroke-ink",
  },
  paper: {
    track: "opacity-30 stroke-paper",
    head: "stroke-paper",
  },
};

/**
 * Reusable animated SVG spinner matching onWard's sleek aesthetic.
 */
export function Spinner({
  size = "md",
  color = "primary",
  label = "Loading",
  className = "",
  ...props
}: SpinnerProps) {
  const sizeClass = SPINNER_SIZES[size] ?? SPINNER_SIZES.md;
  const colorConfig = SPINNER_COLORS[color] ?? SPINNER_COLORS.primary;

  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin shrink-0 ${sizeClass} ${className}`}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeWidth="2.75"
        className={colorConfig.track}
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        strokeWidth="2.75"
        strokeLinecap="round"
        className={colorConfig.head}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </svg>
  );
}

/**
 * Animated three-dot indicator, ideal for subtle typing or waiting states.
 */
export function LoadingDots({
  className = "",
  color = "muted",
}: {
  className?: string;
  color?: "muted" | "primary" | "current" | "ink";
}) {
  const dotColor =
    color === "primary"
      ? "bg-lime-deep"
      : color === "current"
      ? "bg-current"
      : color === "ink"
      ? "bg-ink"
      : "bg-muted";

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${dotColor} [animation-delay:-0.3s]`} />
      <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${dotColor} [animation-delay:-0.15s]`} />
      <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${dotColor}`} />
      <span className="sr-only">Loading</span>
    </span>
  );
}

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual display style */
  variant?: LoadingVariant;
  /** Primary status message (e.g. "Loading…", "Saving changes…") */
  label?: ReactNode;
  /** Secondary subtitle or helper text */
  description?: ReactNode;
  /** Size scaling for spinner and typography */
  size?: "sm" | "md" | "lg";
  /** Spinner color theme */
  spinnerColor?: SpinnerColor;
  /** Custom indicator to render in place of the default spinner */
  indicator?: ReactNode;
  /** Optional determinate progress percentage (0 - 100) */
  progress?: number;
  /** Optional action slot (e.g. a Cancel or Retry button) */
  action?: ReactNode;
  /** Accessible label announced to assistive technologies */
  ariaLabel?: string;
}

/**
 * Primary reusable loading state component for the onWard platform.
 * Supports multiple layouts (card, page, inline, overlay, minimal).
 */
export function LoadingState({
  variant = "card",
  label = "Loading…",
  description,
  size = "md",
  spinnerColor = "primary",
  indicator,
  progress,
  action,
  ariaLabel,
  className = "",
  ...rest
}: LoadingStateProps) {
  const spinnerSize: SpinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  const renderIndicator = () => {
    if (indicator) return indicator;
    return <Spinner size={spinnerSize} color={spinnerColor} />;
  };

  const labelSizeClass =
    size === "sm"
      ? "text-[12px] font-semibold"
      : size === "lg"
      ? "text-[16px] font-bold"
      : "text-[13px] font-semibold";

  const descSizeClass =
    size === "sm" ? "text-[11px]" : size === "lg" ? "text-[13px]" : "text-[12px]";

  // 1. Inline variant
  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={typeof label === "string" ? label : ariaLabel ?? "Loading"}
        className={`inline-flex items-center gap-2 text-ink ${labelSizeClass} ${className}`}
        {...rest}
      >
        {renderIndicator()}
        {label ? <span>{label}</span> : null}
      </div>
    );
  }

  // 2. Overlay variant (for forms, cards, containers being submitted/refreshed)
  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={typeof label === "string" ? label : ariaLabel ?? "Loading"}
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 rounded-[inherit] bg-paper/85 backdrop-blur-[2px] p-4 text-center transition-opacity ${className}`}
        {...rest}
      >
        {renderIndicator()}
        {label ? (
          <p className={`${labelSizeClass} text-ink tracking-tight`}>{label}</p>
        ) : null}
        {description ? (
          <p className={`${descSizeClass} text-muted max-w-[28ch]`}>{description}</p>
        ) : null}
        {typeof progress === "number" ? (
          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-lime transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    );
  }

  // 3. Page variant (full height or section view)
  if (variant === "page") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={typeof label === "string" ? label : ariaLabel ?? "Loading"}
        className={`flex min-h-[45vh] w-full flex-col items-center justify-center p-6 text-center ${className}`}
        {...rest}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream border border-line shadow-sm">
            {renderIndicator()}
          </div>
          {label ? (
            <p className={`${labelSizeClass} text-ink tracking-tight`}>{label}</p>
          ) : null}
          {description ? (
            <p className={`${descSizeClass} text-muted max-w-[34ch] leading-[1.45]`}>
              {description}
            </p>
          ) : null}
          {typeof progress === "number" ? (
            <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-lime transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          ) : null}
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    );
  }

  // 4. Minimal variant (transparent, no border)
  if (variant === "minimal") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={typeof label === "string" ? label : ariaLabel ?? "Loading"}
        className={`flex flex-col items-center justify-center gap-2.5 py-6 text-center ${className}`}
        {...rest}
      >
        {renderIndicator()}
        {label ? (
          <p className={`${labelSizeClass} text-ink tracking-tight`}>{label}</p>
        ) : null}
        {description ? (
          <p className={`${descSizeClass} text-muted max-w-[32ch]`}>{description}</p>
        ) : null}
        {typeof progress === "number" ? (
          <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-lime transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    );
  }

  // 5. Default "card" variant (fits onWard's card design pattern)
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={typeof label === "string" ? label : ariaLabel ?? "Loading"}
      className={`rounded-2xl border border-line bg-paper shadow-card flex flex-col items-center justify-center gap-2.5 p-6 text-center ${className}`}
      {...rest}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream border border-line/80">
        {renderIndicator()}
      </div>
      {label ? (
        <p className={`${labelSizeClass} text-ink tracking-tight`}>{label}</p>
      ) : null}
      {description ? (
        <p className={`${descSizeClass} text-muted max-w-[30ch] leading-[1.45]`}>
          {description}
        </p>
      ) : null}
      {typeof progress === "number" ? (
        <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-lime transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export interface LoadingOverlayWrapperProps extends LoadingStateProps {
  /** When true, shows the overlay on top of children */
  active?: boolean;
  children?: ReactNode;
}

/**
 * Convenient container wrapper that overlays a LoadingState when active.
 *
 * @example
 * <LoadingOverlay active={isSaving} label="Saving changes…">
 *   <form>...</form>
 * </LoadingOverlay>
 */
export function LoadingOverlay({
  active = true,
  children,
  className = "",
  ...loadingProps
}: LoadingOverlayWrapperProps) {
  if (!children) {
    if (!active) return null;
    return <LoadingState variant="overlay" className={className} {...loadingProps} />;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      {active ? <LoadingState variant="overlay" {...loadingProps} /> : null}
    </div>
  );
}

export default LoadingState;

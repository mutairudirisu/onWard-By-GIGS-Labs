import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {crumbs ? (
        <nav className="mb-2 flex items-center gap-1 text-[11.5px] font-medium text-muted">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1">
              {c.href ? (
                <Link href={c.href} className="transition hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="text-inksoft">{c.label}</span>
              )}
              {i < crumbs.length - 1 ? (
                <ChevronRight className="h-3 w-3 text-faint" />
              ) : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle ? <p className="sub mt-1">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

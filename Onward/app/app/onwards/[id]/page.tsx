"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button, Tag } from "@/components/ui";
import { useStore } from "@/components/store";
import type { Evidence } from "@/lib/data";
import { ArrowUpRight, Check, File as FileIcon, Folder, Globe, Image as ImageIcon, TrendingUp } from "lucide-react";

function EvidenceIcon({ kind }: { kind: Evidence["kind"] }) {
  const cls = "h-[15px] w-[15px]";
  if (kind === "url") return <Globe className={cls} />;
  if (kind === "image") return <ImageIcon className={cls} />;
  return <FileIcon className={cls} />;
}

export default function OnWardDetailPage() {
  const params = useParams<{ id: string }>();
  const { onWards, togglePortfolio } = useStore();
  const ward = onWards.find((w) => w.id === params.id);

  if (!ward) {
    return (
      <PhoneShell>
        <div className="mb-4 flex items-center gap-1">
          <BackLink href="/onwards" label="Back to onWards" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Your onWard</h1>
        </div>
        <p className="card px-4 py-6 text-center text-[12px] text-muted">This onWard no longer exists.</p>
        <div className="mt-4">
          <Button href="/onwards">Back to onWards</Button>
        </div>
      </PhoneShell>
    );
  }

  const evidence = ward.evidence ?? [];

  return (
    <PhoneShell>
      <div className="mb-4 flex items-center gap-1">
        <BackLink href="/onwards" label="Back to onWards" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Your onWard</h1>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="tag">{ward.project}</span>
        <span className="text-[9px] font-medium text-muted">{ward.dateLabel}</span>
      </div>

      <h2 className="h1 mb-4 text-[24px]">{ward.title}</h2>

      <section className="mb-5 rounded-2xl bg-lime px-4 py-4">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-inksoft">
          <TrendingUp className="h-3 w-3" /> The difference made
        </p>
        <p className="mt-1.5 text-[18px] font-bold leading-snug tracking-tight text-ink">
          {ward.impact}
        </p>
      </section>

      {ward.body ? (
        <section className="mb-5">
          <h3 className="mb-1.5 text-[13px] font-bold tracking-tight text-ink">
            The work behind the win
          </h3>
          <p className="whitespace-pre-line text-[11px] leading-[1.65] text-inksoft">{ward.body}</p>
        </section>
      ) : null}

      <section className="mb-5">
        <h3 className="mb-2 text-[13px] font-bold tracking-tight text-ink">Skills in action</h3>
        <div className="flex flex-wrap gap-1.5">
          {ward.skills.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-[13px] font-bold tracking-tight text-ink">Supporting evidence</h3>
          <span className="text-[10px] font-semibold text-muted">
            {evidence.length} item{evidence.length === 1 ? "" : "s"}
          </span>
        </div>
        {evidence.length === 0 ? (
          <p className="rounded-xl border border-dashed border-dash px-3.5 py-3 text-center text-[10px] text-muted">
            No evidence attached yet.
          </p>
        ) : (
          <div className="space-y-2">
            {evidence.map((ev) => (
              <div key={ev.id} className="card flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-inksoft">
                  <EvidenceIcon kind={ev.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-ink">{ev.label}</span>
                  <span className="block truncate text-[10px] text-muted">{ev.meta ?? ev.kind}</span>
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-[9px] leading-[1.5] text-muted">
          Evidence supplied by you; not independently verified.
        </p>
      </section>

      <section className="mb-5 flex items-start gap-2.5 rounded-xl border border-lime-deep/40 bg-lime-pale px-3.5 py-3">
        <Folder className="mt-0.5 h-3.5 w-3.5 shrink-0 text-inksoft" />
        <span className="flex-1">
          <span className="block text-[11px] font-bold text-ink">
            {ward.inPortfolio ? "Selected for your portfolio" : "Not in your portfolio"}
          </span>
          <span className="block text-[9px] text-muted">
            {ward.inPortfolio ? "Public when you publish · Private draft until then" : "Keep this win private"}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={ward.inPortfolio}
          aria-label="Include in portfolio"
          onClick={() => togglePortfolio(ward.id)}
          className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition ${
            ward.inPortfolio ? "bg-lime" : "bg-line"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full bg-paper shadow transition-transform ${
              ward.inPortfolio ? "translate-x-4" : ""
            }`}
          >
            {ward.inPortfolio ? <Check className="h-3 w-3 text-lime-deep" strokeWidth={3} /> : null}
          </span>
        </button>
      </section>

      <Button href="/portfolio" icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />}>
        View in my portfolio
      </Button>
    </PhoneShell>
  );
}

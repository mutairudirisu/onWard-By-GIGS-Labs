"use client";

import { useEffect, useState } from "react";
import {
  disablePublicPortfolioShare,
  enablePublicPortfolioShare,
  fetchMyPublicPortfolioShare,
} from "@/lib/portfolio-share";
import { Check, Copy, Link2, LoaderCircle, Link2Off } from "lucide-react";

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function PortfolioShareControls() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMyPublicPortfolioShare()
      .then((current) => {
        if (active) setSlug(current);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorText(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const url =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${slug}`
      : "";

  async function enable() {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      setSlug(await enablePublicPortfolioShare());
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      await disablePublicPortfolioShare();
      setSlug(null);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    setError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Couldn't copy the link. Select it below and copy it manually.");
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-line bg-paper px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-deep">
          <Link2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-bold text-ink">Share your work portfolio</h2>
          <p className="mt-1 text-[9.5px] leading-[1.55] text-muted">
            Anyone with the link can view all your logged onWards, profile details, and progress
            metrics. Your email stays private. Visitors can browse, but must sign up to interact.
          </p>
        </div>
      </div>

      {slug ? (
        <div className="mt-3 space-y-2">
          <input
            aria-label="Public portfolio share link"
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-xl border border-line bg-cream px-3 py-2 text-[10px] text-ink outline-none focus:border-lime-deep"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              disabled={busy}
              className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-lime px-3 text-[10px] font-bold text-dark transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => void disable()}
              disabled={busy}
              className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-[10px] font-semibold text-muted transition hover:bg-cream hover:text-ink disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}
              Turn off
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={loading || busy}
          className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-lime px-3 text-[10px] font-bold text-dark transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
        >
          {loading || busy ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          {loading ? "Checking link…" : "Create public link"}
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-[9.5px] leading-relaxed text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}

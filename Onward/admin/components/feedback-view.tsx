"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, MessageSquareQuote, RefreshCw, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/ui";
import {
  fetchAdminFeedback,
  type AdminFeedback,
  type AdminFeedbackAnswer,
} from "@/lib/admin-api";

const FILTERS: (AdminFeedbackAnswer | "all")[] = ["all", "love_it", "not_really"];

const FILTER_LABEL: Record<AdminFeedbackAnswer | "all", string> = {
  all: "All",
  love_it: "Loving it",
  not_really: "Not really",
};

/** Where the card came up, in the words an admin reads rather than the storage key. */
const SCREEN_LABEL: Record<string, string> = {
  exchange: "upvoted in the Exchange",
  return: "back after a long gap",
};

export function FeedbackView() {
  const [rows, setRows] = useState<AdminFeedback[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<AdminFeedbackAnswer | "all">("all");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      setRows(await fetchAdminFeedback());
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feedback.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((f) => {
      if (answer !== "all" && f.answer !== answer) return false;
      if (
        needle &&
        !`${f.name} ${f.email} ${f.role} ${f.body}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [rows, q, answer]);

  if (state === "error") {
    return (
      <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6E0DC] text-bad">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Could not load feedback</p>
        <p className="tiny max-w-md">{error}</p>
        <button type="button" onClick={() => void load()} className="btn-ghost mt-1">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field-input !py-2 pl-9 text-[12.5px]"
            placeholder="Search name, email or what they wrote…"
            aria-label="Search feedback"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-paper p-1">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAnswer(key)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                answer === key ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {FILTER_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      {state === "loading" ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-16">
          <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading feedback from Supabase…
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel px-6 py-16 text-center">
          <MessageSquareQuote className="mx-auto h-6 w-6 text-faint" />
          <p className="mt-3 text-[13px] font-semibold text-ink">
            {rows.length === 0 ? "Nobody has answered the card yet." : "Nothing matches those filters."}
          </p>
          <p className="tiny mt-1">
            {rows.length === 0
              ? "The question goes up the first time someone new upvotes a post, or when someone comes back after two weeks away."
              : "Try clearing the search or the answer filter."}
          </p>
        </div>
      ) : (
        <div className="panel divide-y divide-line/70 overflow-hidden">
          {filtered.map((f) => {
            const up = f.answer === "love_it";
            return (
              <article key={f.id} className="flex gap-3 px-4 py-4">
                <Avatar name={f.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-[13px] font-bold text-ink">{f.name}</p>
                    <p className="tiny truncate">{f.email || "No email"}</p>
                    <span className="tiny">·</span>
                    <p className="tiny truncate">{f.role} · {f.plan}</p>
                  </div>
                  <p
                    className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      up ? "bg-lime-soft text-good" : "bg-[#F6E0DC] text-bad"
                    }`}
                  >
                    {up ? (
                      <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.4} />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                    )}
                    {up ? "Love it" : "Not really"}
                  </p>
                  {f.body ? (
                    <p className="mt-2 max-w-[70ch] whitespace-pre-wrap text-[12.5px] leading-[1.6] text-inksoft [overflow-wrap:anywhere]">
                      {f.body}
                    </p>
                  ) : (
                    <p className="mt-2 text-[12px] italic text-faint">No words, just the tap.</p>
                  )}
                  <p className="tiny mt-2">
                    {f.when} · {SCREEN_LABEL[f.screen] || f.screen || "asked in the app"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="tiny mt-3">
        Showing <span className="font-bold text-ink">{filtered.length}</span> of {rows.length}{" "}
        {rows.length === 1 ? "answer" : "answers"} · Live from Supabase
      </p>
    </div>
  );
}

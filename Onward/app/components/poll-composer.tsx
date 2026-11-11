"use client";

import { BarChart3, ChevronDown, X } from "lucide-react";
import {
  POST_POLL_MAX_OPTIONS,
  POST_POLL_MIN_OPTIONS,
  POST_POLL_OPTION_MAX,
  POST_POLL_QUESTION_MAX,
} from "@/lib/db";

/** The runs a poll can be given. A preset rather than a picker because the choice is
 *  how long people have to answer, and a day or a week is what that means in practice. */
export const POLL_RUNS = [
  { hours: 1, label: "1 hour" },
  { hours: 6, label: "6 hours" },
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "1 week" },
] as const;

export type PollComposerDraft = {
  question: string;
  options: string[];
  hours: number;
};

export function newPollDraft(): PollComposerDraft {
  return { question: "", options: ["", ""], hours: 24 };
}

/** The instant the poll shuts, worked out when the post is made rather than when the
 *  preset was tapped - a draft left open for an hour does not shorten itself. */
export function pollEndsAt(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

/**
 * The poll half of the composer. Everything here is text the author is still writing,
 * so nothing is checked until the post is sent; pollProblem says what is wrong then.
 */
export function PollComposer({
  draft,
  onChange,
  disabled = false,
}: {
  draft: PollComposerDraft;
  onChange: (next: PollComposerDraft) => void;
  disabled?: boolean;
}) {
  const setQuestion = (question: string) =>
    onChange({ ...draft, question: question.slice(0, POST_POLL_QUESTION_MAX) });

  const setOption = (index: number, label: string) =>
    onChange({
      ...draft,
      options: draft.options.map((option, i) =>
        i === index ? label.slice(0, POST_POLL_OPTION_MAX) : option,
      ),
    });

  const addOption = () =>
    onChange({ ...draft, options: [...draft.options, ""] });

  const removeOption = (index: number) =>
    onChange({ ...draft, options: draft.options.filter((_, i) => i !== index) });

  const field =
    "w-full min-w-0 flex-1 rounded-xl border border-line bg-transparent px-3 py-2 text-[12.5px] text-ink outline-none transition placeholder:text-faint focus:border-dash";

  return (
    <div className="border-t border-line px-4 pb-3.5 pt-3">
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
        <BarChart3 className="h-3.5 w-3.5" /> Poll
      </p>

      <input
        value={draft.question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={disabled}
        placeholder="What are you asking?"
        aria-label="Poll question"
        className={`${field} mt-2 font-semibold`}
      />

      <div className="mt-2 space-y-1.5">
        {draft.options.map((option, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <input
              value={option}
              onChange={(e) => setOption(index, e.target.value)}
              disabled={disabled}
              placeholder={`Choice ${index + 1}`}
              aria-label={`Poll choice ${index + 1}`}
              className={field}
            />
            {draft.options.length > POST_POLL_MIN_OPTIONS ? (
              <button
                type="button"
                aria-label={`Remove choice ${index + 1}`}
                onClick={() => removeOption(index)}
                disabled={disabled}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {draft.options.length < POST_POLL_MAX_OPTIONS ? (
        <button
          type="button"
          onClick={addOption}
          disabled={disabled}
          className="mt-2 cursor-pointer text-[11px] font-bold text-lime-deep transition hover:text-ink disabled:cursor-not-allowed disabled:text-faint"
        >
          Add a choice
        </button>
      ) : null}

      <label className="mt-1.5 flex max-w-[220px] cursor-pointer items-center justify-between rounded-full border border-line bg-transparent px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-lime-deep focus-within:border-lime-deep">
        <select
          value={draft.hours}
          onChange={(e) => onChange({ ...draft, hours: Number(e.target.value) })}
          disabled={disabled}
          aria-label="Poll duration"
          className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-not-allowed"
        >
          {POLL_RUNS.map((run) => (
            <option key={run.hours} value={run.hours}>
              {run.label}
            </option>
          ))}
        </select>
        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
      </label>
    </div>
  );
}

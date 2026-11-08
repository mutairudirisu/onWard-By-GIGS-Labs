"use client";

import { BarChart3, Check } from "lucide-react";
import type { CarriedPoll, PostPoll, PollOption } from "@/lib/db";
import { timeAgo, timeUntil } from "@/lib/dates";

/** The share of the vote one choice has taken, rounded the way the bar is drawn. */
function shareOf(option: PollOption, total: number) {
  if (!total) return 0;
  return Math.round((option.votes / total) * 100);
}

/** The poll as it looks the instant you vote, before the server has answered. */
export function withVote(poll: PostPoll, optionId: string): PostPoll {
  const options = poll.options.map((option) => {
    let votes = option.votes;
    if (option.id === poll.myOptionId) votes -= 1;
    if (option.id === optionId) votes += 1;
    return { ...option, votes: Math.max(0, votes) };
  });
  const total = options.reduce((sum, option) => sum + option.votes, 0);
  return { ...poll, options, total, myOptionId: optionId };
}

/**
 * A poll inside an Exchange entry. The choices are the buttons, so voting is one tap;
 * counts and percentages appear once you have voted or the clock has run out, which is
 * what keeps an open poll from answering itself before anybody has had a say.
 */
export function PollBlock({
  poll,
  signedIn,
  onVote,
}: {
  poll: PostPoll;
  signedIn: boolean;
  /** The choice tapped. The card knows which post it belongs to. */
  onVote: (optionId: string) => void;
}) {
  const voted = Boolean(poll.myOptionId);
  const results = voted || poll.closed;
  const canChoose = signedIn && !poll.closed;
  const left = timeUntil(poll.endsAt);

  return (
    <div className="mt-2.5 rounded-2xl border border-line px-3 pb-2.5 pt-3">
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
        <BarChart3 className="h-3.5 w-3.5" /> Poll
      </p>
      <p className="mt-1.5 text-[12px] font-bold leading-[1.4] tracking-tight text-ink [overflow-wrap:anywhere]">
        {poll.question}
      </p>

      <div className="mt-2.5 space-y-1.5">
        {poll.options.map((option) => {
          const mine = option.id === poll.myOptionId;
          const pct = shareOf(option, poll.total);
          return (
            <button
              key={option.id}
              type="button"
              disabled={!canChoose}
              aria-pressed={mine}
              aria-label={mine ? `Your vote: ${option.label}` : `Vote for ${option.label}`}
              onClick={() => onVote(option.id)}
              className={`relative flex w-full items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition ${
                mine ? "border-dash" : "border-line"
              } ${canChoose ? "cursor-pointer hover:border-dash hover:bg-cream" : "cursor-default"}`}
            >
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 rounded-xl transition-[width] duration-500 ${
                  mine ? "bg-lime-soft" : "bg-lime-pale"
                }`}
                style={{ width: results ? `${pct}%` : "0%" }}
              />
              <span className="relative flex min-w-0 flex-1 items-center gap-1.5">
                {mine ? <Check className="h-3.5 w-3.5 shrink-0 text-lime-deep" /> : null}
                <span className="truncate text-[11.5px] font-semibold text-ink">
                  {option.label}
                </span>
              </span>
              {results ? (
                <span className="relative shrink-0 text-[10.5px] font-bold tabular-nums text-inksoft">
                  {pct}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[9.5px] text-muted">
        <span className="tabular-nums">
          {poll.total} {poll.total === 1 ? "vote" : "votes"}
        </span>
        <span aria-hidden>·</span>
        {poll.closed ? (
          <span>closed {timeAgo(poll.endsAt)} ago</span>
        ) : results ? (
          <span>{left ? `${left} left to change it` : "closing"}</span>
        ) : canChoose ? (
          <span>{left ? `${left} left · tap a choice to vote` : "tap a choice to vote"}</span>
        ) : (
          <span>{left ? `${left} left · sign in to vote` : "sign in to vote"}</span>
        )}
      </p>
    </div>
  );
}

/**
 * The poll a repost carries. Read-only on purpose: the box sits inside the link to the
 * post that holds the poll, so a vote is cast there and not from inside somebody's card.
 */
export function CarriedPollBlock({ poll }: { poll: CarriedPoll }) {
  const left = timeUntil(poll.endsAt);
  return (
    <div className="mt-2.5 rounded-2xl border border-line bg-paper px-3 pb-2.5 pt-3">
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
        <BarChart3 className="h-3.5 w-3.5" /> Poll
      </p>
      <p className="mt-1.5 text-[12px] font-bold leading-[1.4] tracking-tight text-ink [overflow-wrap:anywhere]">
        {poll.question}
      </p>

      <div className="mt-2.5 space-y-1.5">
        {poll.options.map((option) => {
          const pct = shareOf(option, poll.total);
          return (
            <div
              key={option.id}
              className="relative flex w-full items-center gap-2 overflow-hidden rounded-xl border border-line px-2.5 py-2"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-lime-pale"
                style={{ width: `${pct}%` }}
              />
              <span className="relative min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">
                {option.label}
              </span>
              <span className="relative shrink-0 text-[10.5px] font-bold tabular-nums text-inksoft">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[9.5px] text-muted">
        <span className="tabular-nums">
          {poll.total} {poll.total === 1 ? "vote" : "votes"}
        </span>
        <span aria-hidden>·</span>
        {poll.closed ? (
          <span>closed {timeAgo(poll.endsAt)} ago</span>
        ) : (
          <span>{left ? `${left} left` : "closing"} · open it to vote</span>
        )}
      </p>
    </div>
  );
}

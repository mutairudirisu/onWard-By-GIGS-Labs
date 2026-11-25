"use client";

import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button, TextArea } from "@/components/ui/ui";
import { useStore } from "@/components/providers/store";
import { sendFeedback, type FeedbackAnswer } from "@/lib/db";
import { closeFeedback, markSeen, useFeedbackAsk } from "@/lib/feedback";
import { haptic } from "@/lib/haptics";

/** Why the card came up, said once, in the card's own voice. */
const INTRO: Record<string, string> = {
  exchange: "You are still early with onWard, which makes this the answer we can use most.",
  return: "It has been a while since you were here. What sent you off, and what brings you back?",
};

/** The follow-up changes with the tap, because a good answer and a bad one need different words. */
const FOLLOW_UP: Record<FeedbackAnswer, { ask: string; placeholder: string }> = {
  love_it: {
    ask: "What is working?",
    placeholder: "The part you would miss if it went.",
  },
  not_really: {
    ask: "What went wrong?",
    placeholder: "Where you got stuck, in your own words.",
  },
};

export function FeedbackPrompt() {
  const screen = useFeedbackAsk();
  const { settings } = useStore();
  const [answer, setAnswer] = useState<FeedbackAnswer | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Being mounted is the app being opened, which is the only moment the gap between
  // visits can be measured.
  useEffect(() => {
    markSeen();
  }, []);

  if (!screen) return null;

  const buzz = (kind: "tap" | "success") => haptic(kind, settings.haptics);

  const close = () => {
    setAnswer(null);
    setBody("");
    setError(null);
    setBusy(false);
    closeFeedback();
  };

  const pick = (next: FeedbackAnswer) => {
    buzz("tap");
    setAnswer(next);
  };

  const send = async () => {
    if (!answer) return;
    setBusy(true);
    setError(null);
    try {
      await sendFeedback({ answer, body, screen });
      buzz("success");
      close();
    } catch (err) {
      // The card stays open with the words still in it, so a failed send is retryable
      // rather than a silent loss.
      setError(err instanceof Error ? err.message : "Could not send that.");
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={close} title="How is onWard so far?">
      {answer === null ? (
        <>
          <p className="text-[12px] leading-[1.55] text-inksoft">
            {INTRO[screen] ?? "Two people build this. Nothing here is too small to say."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              onClick={() => pick("not_really")}
              iconLeft={<ThumbsDown className="h-4 w-4 shrink-0" strokeWidth={2.2} />}
              className="whitespace-nowrap"
            >
              Not really
            </Button>
            <Button
              variant="secondary"
              onClick={() => pick("love_it")}
              iconLeft={<ThumbsUp className="h-4 w-4 shrink-0" strokeWidth={2.2} />}
              className="whitespace-nowrap"
            >
              Love it!
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[12px] leading-[1.55] text-inksoft">{FOLLOW_UP[answer].ask}</p>
          <TextArea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={FOLLOW_UP[answer].placeholder}
            maxLength={1000}
            className="mt-3 min-h-[92px]"
          />
          <p className="mt-1.5 text-[10px] leading-[1.45] text-muted">
            Optional. Only the onWard team reads these.
          </p>
          {error ? (
            <p className="mt-2 text-[10.5px] leading-[1.45] text-[#E5484D]">{error}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Button
              variant="quiet"
              onClick={() => void send()}
              disabled={busy}
              aria-label="Send your rating without a comment"
              className="whitespace-nowrap"
            >
              No comment
            </Button>
            <Button onClick={() => void send()} disabled={busy} className="whitespace-nowrap">
              {busy ? "Sending…" : "Send"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

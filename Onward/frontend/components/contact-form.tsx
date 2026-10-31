"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const TOPICS = [
  "General question",
  "Product support",
  "Press & media",
  "Careers",
  "Employers & teams",
  "Something else",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "opening" | "done">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const topic = String(fd.get("topic") || TOPICS[0]);
    const message = String(fd.get("message") || "").trim();

    const subject = encodeURIComponent(`[onWard] ${topic} — ${name || "website enquiry"}`);
    const body = encodeURIComponent(
      `${message}\n\n—\n${name}${email ? ` · ${email}` : ""}\nSent from onWard.com/contact`,
    );

    setStatus("opening");
    window.location.href = `mailto:hello@gigslabs.example?subject=${subject}&body=${body}`;
    window.setTimeout(() => setStatus("done"), 400);
  }

  const field =
    "w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-lime-deep focus:ring-2 focus:ring-lime/30";

  return (
    <div className="relative">
      {status === "done" ? (
        <div className="flex flex-col items-center rounded-2xl border border-lime-deep/40 bg-lime-pale px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Check className="h-6 w-6" strokeWidth={2.6} />
          </span>
          <h3 className="h3 mt-5">Your email is ready to send</h3>
          <p className="lead mt-2 max-w-sm text-[14.5px]">
            We opened a draft in your mail app addressed to GIGS Labs. Hit send
            and we&apos;ll reply within one business day.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="btn-ghost mt-6"
          >
            Write another message
          </button>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-line bg-mist p-6 shadow-card sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">
                Your name
              </span>
              <input name="name" required placeholder="Ada Obi" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className={field}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-bold text-ink">
              What is it about?
            </span>
            <select name="topic" className={field} defaultValue={TOPICS[0]}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-bold text-ink">
              Message
            </span>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Tell us what you need — the more context, the better."
              className={`${field} resize-none`}
            />
          </label>

          <button
            type="submit"
            disabled={status === "opening"}
            className="btn-lime mt-6 w-full disabled:opacity-70"
          >
            {status === "opening" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Opening your mail app…
              </>
            ) : (
              <>
                Send message <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </>
            )}
          </button>
          <p className="tiny mt-3 text-center">
            This form opens your own email app — we never store what you type on
            this page.
          </p>
        </form>
      )}
    </div>
  );
}

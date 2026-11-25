"use client";

import { useRef, useState } from "react";
import { PhoneShell } from "@/components/layout/phone-shell";
import { ArrowIcon, Button } from "@/components/ui/ui";
import { AuthTop } from "@/components/auth/auth-decor";

const LENGTH = 6;

export default function VerifyPage() {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setAt(i: number, v: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function handleChange(i: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      setAt(i, "");
      return;
    }
    // Spread pasted digits across boxes starting here.
    const next = [...digits];
    for (let k = 0; k < only.length && i + k < LENGTH; k++) next[i + k] = only[k];
    setDigits(next);
    const target = Math.min(i + only.length, LENGTH - 1);
    refs.current[target]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setAt(i - 1, "");
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <PhoneShell>
      <AuthTop />
      <p className="eyebrow mb-3">Step 2 of 3 · 30s left</p>
      <h1 className="h1 mb-3">
        Enter the code
        <br />
        we sent you.
      </h1>
      <p className="sub mb-8">
        We emailed a 6-digit code to{" "}
        <span className="font-semibold text-ink">you@example.com</span>. It expires in 10 minutes.
      </p>

      <div className="mb-8 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1}`}
            value={d}
            maxLength={1}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`h-14 min-w-0 flex-1 rounded-xl border-2 bg-paper text-center text-[22px] font-bold text-ink outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40 ${
              d ? "border-lime-deep" : "border-line"
            }`}
          />
        ))}
      </div>

      <div className="space-y-4">
        <Button href="/usage" variant="dark" icon={<ArrowIcon />}>
          Verify code
        </Button>
        <p className="text-center text-[11px] text-muted">
          Didn&apos;t get it?{" "}
          <span className="font-semibold text-inksoft">Resend code</span>{" "}
          <span className="text-faint">(24s)</span>
        </p>
      </div>
    </PhoneShell>
  );
}

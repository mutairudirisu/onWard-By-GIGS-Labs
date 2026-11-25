"use client";

import { useEffect, useState } from "react";
import { AuthHeader } from "@/components/layout/phone-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { ArrowIcon, BackLink, Button, Field, TextInput } from "@/components/ui/ui";
import { useAuth } from "@/components/providers/auth";
import { Lock, Mail, MailCheck, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await sendPasswordReset(email.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
      <AuthHeader href="/sign-in" />

      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-lime-deep/40 bg-lime-soft">
        {sent ? <MailCheck className="h-5 w-5 text-ink" /> : <Mail className="h-5 w-5 text-ink" />}
      </span>

      <p className="eyebrow mb-3 flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-lime-deep" /> Fresh start?
      </p>
      <h1 className="h1 mb-2">{sent ? "Check your inbox." : "Let's get you back in."}</h1>
      <p className="sub mb-7">
        {sent
          ? `If ${email.trim()} matches an account, a reset link is on its way.`
          : "Enter your account email. We'll send a link to reset your password."}
      </p>

      {sent ? (
        <div className="card px-4 py-3.5">
          <p className="text-[12px] font-bold text-ink">Follow the link to set a new password.</p>
          <p className="mt-1.5 text-[10px] leading-[1.55] text-muted">
            The link works once and expires after an hour. Check your spam folder if it hasn&apos;t
            arrived, then try again.
          </p>
          <p className="mt-3 border-t border-line pt-2.5 text-[10px] font-medium text-inksoft">
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-bold underline hover:text-ink"
            >
              Try another email
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email address">
            <TextInput
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
              trailing={<Mail className="h-4 w-4" />}
            />
          </Field>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5">
            <Button type="submit" icon={<ArrowIcon />} disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </div>
        </form>
      )}

      <div className="card mt-6 px-4 py-3.5">
        <p className="text-[12px] font-bold text-ink">A small detour. You&apos;ve got this.</p>
        <p className="mt-1.5 text-[10px] leading-[1.55] text-muted">
          If an account matches this email, you&apos;ll receive a reset link valid for 30 minutes.
          Check your spam folder too.
        </p>
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-[10px] font-medium text-inksoft">
          <Lock className="h-3 w-3" /> Your plans and progress will stay safe.
        </p>
      </div>

      <p className="mt-6 text-center">
        <BackLink
          href="/sign-in"
          label="Back to sign in"
          className="text-[11px] font-semibold text-inksoft underline"
        >
          Back to sign in
        </BackLink>
      </p>
    </AuthShell>
  );
}

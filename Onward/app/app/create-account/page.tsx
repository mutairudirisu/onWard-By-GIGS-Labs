"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/phone-shell";
import { AuthShell } from "@/components/auth-shell";
import { ArrowIcon, Button, Field, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth";
import { Check, Eye, EyeOff, Mail, MailCheck } from "lucide-react";

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function CreateAccountPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  // The welcome screen hands the typed email over in the query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
    const ref = params.get("ref")?.trim();
    if (ref) {
      try {
        localStorage.setItem("onward.ref", ref.toUpperCase());
      } catch {
        /* storage unavailable — the code is still visible in the URL */
      }
    }
  }, []);

  const score = useMemo(() => strengthOf(password), [password]);
  const barWidth = ["w-0", "w-1/4", "w-1/2", "w-3/4", "w-full"][score];

  async function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!agreed) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await signUp(name.trim(), email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setSentTo(email.trim());
      return;
    }
    router.push("/today");
  }

  if (sentTo) {
    return (
      <AuthShell>
        <AuthHeader href="/sign-in" />
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-lime-deep/40 bg-lime-soft">
          <MailCheck className="h-5 w-5 text-ink" />
        </span>
        <p className="eyebrow mb-3">One last step</p>
        <h1 className="h1 mb-2">Confirm your email.</h1>
        <p className="sub mb-7">
          We sent a magic link to <span className="font-semibold text-ink">{sentTo}</span>. Open it
          to finish setting up your account.
        </p>
        <div className="card px-4 py-3.5">
          <p className="text-[11px] leading-[1.55] text-muted">
            Nothing in your inbox? Check spam, or go back and sign in once the link has been used.
          </p>
        </div>
        <div className="mt-6">
          <Button href="/sign-in" variant="secondary" icon={<ArrowIcon />}>
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader />
      <p className="eyebrow mb-3">Your next chapter</p>
      <h1 className="h1 mb-2">Make room for growth.</h1>
      <p className="sub mb-7">A home for your plans today and the story you&apos;ll tell tomorrow.</p>

      <form onSubmit={submit}>
        <div className="space-y-4">
        <Field label="Your name">
          <TextInput
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            maxLength={80}
            required
          />
        </Field>
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
        <Field label="Create password">
          <TextInput
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
            trailing={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className={`block h-full ${barWidth} rounded-full ${
                  score >= 3 ? "bg-lime" : score === 2 ? "bg-lime/60" : "bg-dash"
                } transition-all`}
              />
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-inksoft">
              {password ? (
                <>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${score >= 3 ? "bg-lime" : "bg-dash"}`}
                  />
                  {STRENGTH_LABEL[score]}
                  <span className="font-normal text-muted">· {password.length} characters</span>
                </>
              ) : (
                <span className="font-normal text-muted">Use 8+ characters, mixed case and a number.</span>
              )}
            </span>
          </div>
        </Field>
        </div>

      <button
        type="button"
        onClick={() => setAgreed((v) => !v)}
        className="mt-5 flex items-start gap-2.5 text-left"
      >
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border ${
            agreed ? "border-lime-deep bg-lime" : "border-dash bg-paper"
          }`}
        >
          {agreed ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
        </span>
        <span className="text-[10px] leading-[1.5] text-muted">
          I agree to the <span className="font-semibold text-inksoft underline">Terms of Service</span>{" "}
          and <span className="font-semibold text-inksoft underline">Privacy policy</span>. My work
          is private by default.
        </span>
      </button>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" icon={<ArrowIcon />} disabled={busy}>
          {busy ? "Creating…" : "Create my account"}
        </Button>
      </div>
      </form>

      <p className="mt-7 text-center text-[11px] text-muted">
        Already growing with us?{" "}
        <Link href="/sign-in" className="font-semibold text-ink underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

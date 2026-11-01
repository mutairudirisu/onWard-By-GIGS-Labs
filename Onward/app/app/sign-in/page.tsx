"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/phone-shell";
import { AuthShell } from "@/components/auth-shell";
import { ArrowIcon, Button, Divider, Field, TextInput } from "@/components/ui";
import { useAuth, readAuthMethod, type AuthMethod } from "@/components/auth";
import { GoogleIcon, LastUsedTag } from "@/components/auth-decor";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
      {children}
    </p>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [last, setLast] = useState<AuthMethod | null>(null);

  // The welcome screen hands the typed email over in the query string.
  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
    setLast(readAuthMethod());
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy("email");
    setError("");
    const result = await signIn(
      email || String(data.get("email") ?? "").trim(),
      String(data.get("password") ?? ""),
    );
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/today");
  }

  async function withGoogle() {
    setBusy("google");
    setError("");
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setBusy(null);
    }
  }

  return (
    <AuthShell>
      <AuthHeader />
      <p className="eyebrow mb-3">Pick up where you left off</p>
      <h1 className="h1 mb-2">Good to see you.</h1>
      <p className="sub mb-7">Your plans, notes and little wins are right where you left them.</p>

      <form onSubmit={submit} className="space-y-4">
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
        <Field label="Password">
          <TextInput
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Your password"
            autoComplete="current-password"
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
        </Field>

        <div className="mt-2 flex justify-end">
          <Link href="/forgot-password" className="text-[11px] font-semibold text-inksoft underline">
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          {last === "email" ? <LastUsedTag /> : null}
          <Button type="submit" icon={<ArrowIcon />} disabled={busy !== null}>
            {busy === "email" ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="my-5">
        <Divider>or keep it simple</Divider>
      </div>

      <div className="relative">
        {last === "google" ? <LastUsedTag /> : null}
        <Button
          variant="secondary"
          onClick={withGoogle}
          iconLeft={<GoogleIcon />}
          disabled={busy !== null}
        >
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </Button>
      </div>

      <p className="mt-7 text-center text-[11px] text-muted">
        New to onWard?{" "}
        <Link href="/create-account" className="font-semibold text-ink underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-faint">
        <Lock className="h-2.5 w-2.5" /> Your work stays private until you share it.
      </p>
    </AuthShell>
  );
}

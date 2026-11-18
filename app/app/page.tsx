"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { PhoneShell } from "@/components/phone-shell";
import { ArrowIcon, Button, Divider, TextInput } from "@/components/ui";
import { AuthBrand, DotField, GoogleAuthButton, LastUsedTag } from "@/components/auth-decor";
import { readAuthMethod, useAuth, type AuthMethod } from "@/components/auth";
import {
  Check,
  ListChecks,
  Mail,
  MessageCircle,
  Sprout,
  Timer,
  UsersRound,
} from "lucide-react";

function StartForm({
  email,
  onEmail,
  onEmailSubmit,
  onGoogle,
  busy,
  error,
  emphasis,
  last,
}: {
  email: string;
  onEmail: (value: string) => void;
  onEmailSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
  busy: boolean;
  error: string;
  emphasis: "dark" | "primary";
  last: AuthMethod | null;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        {last === "google" ? <LastUsedTag /> : null}
        <GoogleAuthButton onClick={onGoogle} busy={busy} />
      </div>
      <Divider>or</Divider>
      <form onSubmit={onEmailSubmit}>
        <div className="relative">
          <TextInput
            type="email"
            name="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            trailing={<Mail className="h-4 w-4" />}
          />
        </div>
        <div className="relative mt-3">
          {last === "email" ? <LastUsedTag /> : null}
          <Button type="submit" variant={emphasis} icon={<ArrowIcon />}>
            Continue with email
          </Button>
        </div>
      </form>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<AuthMethod | null>(null);

  // localStorage is only readable on the client.
  useEffect(() => setLast(readAuthMethod()), []);

  async function withGoogle() {
    setBusy(true);
    setError("");
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setBusy(false);
    }
  }

  function withEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = email.trim();
    router.push(clean ? `/create-account?email=${encodeURIComponent(clean)}` : "/create-account");
  }

  const form = {
    email,
    onEmail: setEmail,
    onEmailSubmit: withEmail,
    onGoogle: withGoogle,
    busy,
    error,
    last,
  };

  return (
    <>
      <div className="lg:hidden">
        <PhoneShell>
          <div className="flex min-h-[calc(100dvh-96px)] flex-col">
            <div className="relative mb-8">
              <DotField className="absolute -top-3 left-0 h-24 w-full" />
              <div className="relative">
                <AuthBrand />
                <div aria-hidden className="mt-5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-deep/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-deep/35" />
                  <span className="h-px flex-1 border-t-2 border-dotted border-dash" />
                </div>
              </div>
            </div>

            <p className="eyebrow mb-3">Small steps. Real progress.</p>
            <h1 className="h1 mb-7">
              Your everyday,
              <br />
              going places.
            </h1>

            <div className="relative mb-7 overflow-hidden rounded-2xl bg-lime-soft px-5 pb-5 pt-7">
              <span className="absolute -right-9 -top-11 h-28 w-28 rounded-full bg-lime" />
              <span className="absolute -bottom-2 left-9 h-12 w-px rotate-[24deg] border-l-2 border-dashed border-ink/20" />
              <span className="absolute right-12 top-6 h-9 w-px -rotate-[18deg] border-l-2 border-dashed border-ink/20" />
              <div className="relative ml-3 -rotate-2 rounded-xl bg-panel px-4 py-4 shadow-lift">
                <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-lime">
                  <Sprout className="h-3 w-3" strokeWidth={2.2} /> A new onWard
                </p>
                <p className="text-[12px] font-medium leading-relaxed text-on-panel">
                  Turned effort into
                  <br />
                  something worth sharing.
                </p>
              </div>
              <div className="relative mt-3 ml-0 w-[78%] rotate-[-1deg] rounded-xl bg-paper px-3 py-2.5 shadow-lift">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-lime">
                    <Check className="h-3 w-3 text-dark" strokeWidth={3} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold text-ink">
                      Made something better.
                    </span>
                    <span className="block text-[9px] text-muted">
                      One onWard. One step forward.
                    </span>
                  </span>
                </div>
              </div>
              <div className="relative mt-3 grid grid-cols-2 gap-2">
                <div className="-rotate-1 rounded-xl border border-line/80 bg-paper/95 p-2.5 shadow-card">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-ink">
                    <MessageCircle className="h-3 w-3 text-lime-deep" />
                    <UsersRound className="h-3 w-3 text-lime-deep" />
                    Exchange & Network
                  </span>
                  <span className="mt-1 block text-[8px] leading-snug text-muted">
                    Share and connect
                  </span>
                </div>
                <div className="rotate-1 rounded-xl border border-line/80 bg-paper/95 p-2.5 shadow-card">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-ink">
                    <Timer className="h-3 w-3 text-lime-deep" />
                    <ListChecks className="h-3 w-3 text-lime-deep" />
                    Focus & Checklist
                  </span>
                  <span className="mt-1 block text-[8px] leading-snug text-muted">
                    Plan and follow through
                  </span>
                </div>
              </div>
              <span className="relative mt-3 ml-auto flex w-fit items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[9px] font-bold text-dark">
                <Sprout className="h-2.5 w-2.5" strokeWidth={2.2} /> Your growth, documented
              </span>
            </div>

            <p className="sub mb-6">
              Plan your day. Capture your wins. Build a story of your work you&apos;re proud to
              share.
            </p>

            <div className="mt-auto">
              <StartForm {...form} emphasis="dark" />
              <p className="pt-3.5 text-center text-[10px] text-muted">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-semibold text-ink underline">
                  Sign in
                </Link>
              </p>
              <p className="pt-2 text-center text-[9px] text-faint">
                A little more intention. A lot more progress.
              </p>
            </div>
          </div>
        </PhoneShell>
      </div>

      <div className="hidden lg:block">
        <AuthShell>
          <h1 className="h1 mb-2">Your everyday, going places.</h1>
          <p className="sub mb-8">
            Plan your day, capture your wins, and build a story of your work you&apos;re proud to
            share.
          </p>
          <StartForm {...form} emphasis="primary" />
          <p className="mt-7 text-center text-[11px] text-muted">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-ink underline">
              Sign in
            </Link>
          </p>
        </AuthShell>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Wordmark } from "@/components/wordmark";
import { checkAdmin } from "@/lib/admin-api";
import { AdminSessionContext, type AdminSession } from "@/lib/admin-session";
import { supabase } from "@/lib/supabase";

function initialsOf(value: string) {
  const words = value.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]).join("");
  return (letters || "OW").toUpperCase();
}

type Phase = "loading" | "signed-out" | "denied" | "ready";

export function AdminGateway({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolve(signedIn: boolean, userEmail: string, metaName?: string) {
      if (!signedIn) {
        if (!cancelled) setPhase("signed-out");
        return;
      }
      try {
        const allowed = await checkAdmin();
        if (cancelled) return;
        if (!allowed) {
          setPhase("denied");
          return;
        }
        const name = metaName?.trim() || userEmail.split("@")[0] || "Admin";
        setSession({
          email: userEmail,
          name,
          initials: initialsOf(name),
          signOut: async () => {
            await supabase.auth.signOut();
            setSession(null);
            setPhase("signed-out");
          },
        });
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("denied");
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      resolve(Boolean(data.session), user?.email ?? "", user?.user_metadata?.name as string | undefined);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setPhase("signed-out");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setBusy(false);
      setError(signInError.message);
      return;
    }
    try {
      const allowed = await checkAdmin();
      if (!allowed) {
        await supabase.auth.signOut();
        setError("That account is not on the admin list.");
        setBusy(false);
        return;
      }
      const user = data.user;
      const name =
        (user?.user_metadata?.name as string | undefined)?.trim() ||
        user?.email?.split("@")[0] ||
        "Admin";
      setSession({
        email: user?.email ?? "",
        name,
        initials: initialsOf(name),
        signOut: async () => {
          await supabase.auth.signOut();
          setSession(null);
          setPhase("signed-out");
        },
      });
      setPhase("ready");
    } catch {
      setError("Could not verify admin access. Try again.");
    }
    setBusy(false);
  }

  if (phase === "ready" && session) {
    return (
      <AdminSessionContext.Provider value={session}>
        <AdminShell>{children}</AdminShell>
      </AdminSessionContext.Provider>
    );
  }

  if (phase === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking admin access…
        </span>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="panel w-full max-w-sm p-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6E0DC] text-bad">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h1 className="h2 mt-4">Admin access only</h1>
          <p className="tiny mt-2">
            {session?.email ?? "This account"} is signed in but is not on the admin list. Ask the
            platform owner to add it in Supabase.
          </p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut().then(() => setPhase("signed-out"))}
            className="btn-ghost mt-5 w-full justify-center"
          >
            Use another account
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4">
      <form onSubmit={submit} className="panel w-full max-w-sm p-6">
        <Wordmark className="text-[16px]" />
        <p className="eyebrow mt-5">Admin console</p>
        <h1 className="h2 mt-1">Sign in to manage onWard.</h1>
        <p className="tiny mt-2">Use the email and password of an admin account.</p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@onward.app"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-[#F6C9C4] bg-[#FBE9E7] px-3 py-2 text-[11.5px] font-semibold text-bad">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn-lime mt-5 w-full justify-center">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

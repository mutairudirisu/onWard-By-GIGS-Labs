"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldAlert, ShieldCheck, Sprout } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { checkAdmin } from "@/lib/admin-api";
import { AdminSessionContext, type AdminSession } from "@/lib/admin-session";
import { supabase } from "@/lib/supabase";

function initialsOf(value: string) {
  const words = value.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]).join("");
  return (letters || "OW").toUpperCase();
}

type Phase = "loading" | "signed-out" | "denied" | "ready";

/**
 * Sign-in frame. Mobile: the plain centred card the console has always used.
 * Large screens: the same dark split the onWard app uses — brand panel left,
 * form right.
 */
function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:bg-[#0C0D08]">
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:px-14 lg:py-12 xl:px-[84px] xl:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 85% at 0% 104%, rgba(201,242,78,0.9) 0%, rgba(150,190,45,0.5) 20%, rgba(66,82,24,0.4) 44%, rgba(12,13,8,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-28 h-[380px] w-[480px] rounded-full bg-lime/35 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1.1px, transparent 1.3px)",
            backgroundSize: "54px 54px",
            opacity: 0.32,
            maskImage: "linear-gradient(to bottom, black, transparent 58%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 58%)",
          }}
        />

        <div className="relative flex w-fit items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime">
            <Sprout className="h-5 w-5 text-dark" strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-bold tracking-tight text-white">
            <span className="text-lime">o</span>nWard
            <span className="ml-1.5 rounded-md bg-lime px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-dark">
              Admin
            </span>
          </span>
        </div>

        <div className="relative mb-24 mt-auto xl:mb-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime">
            Internal console
          </p>
          <p className="mt-3 max-w-[19ch] text-balance text-[clamp(28px,2.5vw,40px)] font-bold leading-[1.14] tracking-[-0.02em] text-white">
            For authorised operators only.
          </p>
          <p className="mt-4 max-w-[38ch] text-[13px] leading-[1.6] text-white/50">
            Everything in here reads live accounts and can reach every user at once. Access is
            checked against the admin list on each sign-in.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col px-5 py-10 lg:px-16 lg:py-12 xl:px-24">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center lg:max-w-[430px]">
          {children}
        </div>
        <p className="mt-8 hidden text-center text-[11px] text-white/25 lg:block">
          © 2026 onWard · A GIGS Labs product
        </p>
      </div>
    </div>
  );
}

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
      <AuthFrame>
        <div className="panel w-full p-6 text-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6E0DC] text-bad">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h1 className="h2 mt-4 lg:text-white">Admin access only</h1>
          <p className="tiny mt-2 lg:text-white/50">
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
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <form
        onSubmit={submit}
        className="panel w-full p-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      >
        <p className="eyebrow lg:text-lime">Authorised users only</p>
        <h1 className="h2 mt-1 lg:text-white">Sign in to the admin console.</h1>
        <p className="tiny mt-2 lg:text-white/50">
          This console reads live onWard accounts and sends notifications to them. Access is checked
          against the admin list on every sign-in.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="label lg:text-white/60" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="field-input lg:border-white/15 lg:bg-white/[0.06] lg:text-white lg:placeholder-white/25"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@onward.app"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label lg:text-white/60" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="field-input lg:border-white/15 lg:bg-white/[0.06] lg:text-white lg:placeholder-white/25"
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

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-[1.5] text-muted lg:text-white/40">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-lime-deep lg:text-lime" />
          Not on the list? Nothing here opens — the console signs you straight back out.
        </p>
      </form>
    </AuthFrame>
  );
}

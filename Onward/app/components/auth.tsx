"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchProfile, initialsFor, saveProfile, type Profile } from "@/lib/db";
import { Sprout } from "lucide-react";

export type AuthResult = { error?: string; needsConfirmation?: boolean };

type AuthValue = {
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  changeEmail: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id" | "plan">>) => Promise<AuthResult>;
};

const AuthCtx = createContext<AuthValue | null>(null);

// Signed-out visitors are allowed here; everything else needs a session.
const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/create-account",
  "/forgot-password",
  "/verify",
  "/usage",
];

// These are the entry screens a signed-in user should be bounced away from.
const ENTRY_ROUTES = ["/", "/sign-in", "/create-account"];

function message(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

function fallbackProfile(user: User): Profile {
  const meta = user.user_metadata as Record<string, string | undefined>;
  const name =
    meta.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || "You";
  return {
    id: user.id,
    displayName: name,
    initials: initialsFor(name),
    role: meta.role ?? "",
    location: "",
    bio: "",
    avatarUrl: meta.avatar_url ?? null,
    plan: "free",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    // The Google/code flow swaps the URL for a session before it is readable.
    const exchangePending = /([?&]code=|#access_token=)/.test(window.location.href);

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      setSession(next);
      setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (cancelled) return;
      setSession(current);
      if (!exchangePending && !current) setReady(true);
    });

    const timer = exchangePending
      ? window.setTimeout(() => !cancelled && setReady(true), 5000)
      : 0;

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchProfile(userId)
      .then((next) => {
        if (!cancelled && next) setProfile(next);
      })
      .catch(() => {
        /* the fallback profile keeps the shell usable until the row is readable */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signUp = useCallback<AuthValue["signUp"]>(
    async (name, email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/today`,
        },
      });
      if (error) return { error: message(error) };
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signIn = useCallback<AuthValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: message(error) };
    return {};
  }, []);

  const signInWithGoogle = useCallback<AuthValue["signInWithGoogle"]>(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/today` },
    });
    if (error) return { error: message(error) };
    return {};
  }, []);

  const sendPasswordReset = useCallback<AuthValue["sendPasswordReset"]>(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/today`,
    });
    if (error) return { error: message(error) };
    return {};
  }, []);

  const changeEmail = useCallback<AuthValue["changeEmail"]>(async (email) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { error: message(error) };
    return {};
  }, []);

  const signOut = useCallback<AuthValue["signOut"]>(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback<AuthValue["updateProfile"]>(
    async (patch) => {
      if (!user) return { error: "You are not signed in." };
      const base = profile ?? fallbackProfile(user);
      const next: Profile = { ...base, ...patch };
      if (patch.displayName !== undefined) next.initials = initialsFor(patch.displayName);
      setProfile(next);
      try {
        await saveProfile(user.id, next);
      } catch (err) {
        return { error: message(err) };
      }
      return {};
    },
    [profile, user],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile: profile ?? (user ? fallbackProfile(user) : null),
      ready,
      signUp,
      signIn,
      signInWithGoogle,
      sendPasswordReset,
      changeEmail,
      signOut,
      updateProfile,
    }),
    [
      user,
      profile,
      ready,
      signUp,
      signIn,
      signInWithGoogle,
      sendPasswordReset,
      changeEmail,
      signOut,
      updateProfile,
    ],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * The signed-in person rendered as the shape the screens already expect, so a
 * page only needs one hook call instead of poking at the profile row itself.
 */
export function useCurrentUser() {
  const { user, profile } = useAuth();
  const base = profile ?? (user ? fallbackProfile(user) : null);
  return {
    name: base?.displayName ?? "",
    initials: base?.initials ?? "",
    email: user?.email ?? "",
    role: base?.role ?? "",
    location: base?.location ?? "",
    bio: base?.bio ?? "",
    avatarUrl: base?.avatarUrl ?? null,
    plan: base?.plan ?? "free",
  };
}

export type CurrentUser = ReturnType<typeof useCurrentUser>;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isEntry = ENTRY_ROUTES.includes(pathname);
  const blocked = (!user && !isPublic) || (Boolean(user) && isEntry);

  useEffect(() => {
    if (!ready || !blocked) return;
    router.replace(user ? "/today" : "/sign-in");
  }, [ready, blocked, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <Sprout className="h-7 w-7 animate-pulse text-lime-deep" strokeWidth={2.2} />
      </div>
    );
  }
  if (blocked) return null;
  return <>{children}</>;
}

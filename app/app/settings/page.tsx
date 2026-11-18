"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button, Chip, PageHeader, Toggle } from "@/components/ui";
import { ProBadge } from "@/components/pro";
import { useStore } from "@/components/store";
import { useAuth } from "@/components/auth";
import { useNotifications } from "@/components/notifications";
import { canVibrate, haptic } from "@/lib/haptics";
import { resolveTheme, useSystemDark } from "@/lib/theme";
import {
  AtSign,
  Bell,
  CalendarHeart,
  ChevronRight,
  Crown,
  Inbox,
  LogOut,
  Mail,
  Moon,
  Sun,
  Vibrate,
} from "lucide-react";

function Row({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 lg:gap-4 lg:px-5 lg:py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-inksoft">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-ink lg:text-[15px]">{title}</span>
        {hint ? <span className="block text-[10.5px] text-muted lg:text-[12px]">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, setSetting, isPro } = useStore();
  const { signOut: leave, user } = useAuth();
  const { enableAlerts, permission, pushReady, pushError, unread } = useNotifications();
  // The icon and the System note describe what is on the screen, so both answer with
  // the resolved theme rather than the word chosen below it.
  const dark = resolveTheme(settings.theme, useSystemDark()) === "dark";
  const [leaving, setLeaving] = useState(false);
  const [vibrates, setVibrates] = useState<boolean | null>(null);

  // Only known after mount — navigator is missing while the server renders.
  useEffect(() => setVibrates(canVibrate()), []);

  const doSignOut = async () => {
    setLeaving(true);
    await leave();
    router.push("/");
  };

  return (
    <PhoneShell indicator>
      <div className="mb-4 flex items-center gap-1 lg:mb-2">
        <BackLink href="/profile" label="Back to profile" />
      </div>
      <PageHeader title="Settings" subtitle="Tune how onWard looks, nudges and remembers you." />

      <section className="mb-6">
        <p className="eyebrow mb-2">Your plan</p>
        <div className="card flex items-center gap-3 px-4 py-4 lg:px-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-dark">
            <Crown className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-ink lg:text-[16px]">
                onWard {isPro ? "Pro" : "Free"}
              </span>
              {isPro ? <ProBadge /> : null}
            </span>
            <span className="block text-[11px] text-muted lg:text-[12px]">
              {isPro
                ? "Every Pro capability is active."
                : "3 onWards a month, no evidence attachments."}
            </span>
          </span>
          <button
            type="button"
            onClick={() => router.push("/upgrade")}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition lg:text-[13px] ${
              isPro
                ? "border border-line bg-paper text-ink hover:bg-cream"
                : "bg-lime text-dark hover:bg-lime-deep"
            }`}
          >
            {isPro ? "Manage" : "Upgrade"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section>
          <p className="eyebrow mb-2">Appearance</p>
          <div className="card divide-y divide-line overflow-hidden">
            <div className="px-4 py-4 lg:px-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-inksoft">
                  {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                </span>
                <span className="text-[13px] font-bold text-ink lg:text-[15px]">Theme</span>
              </div>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <Chip
                    key={t}
                    active={settings.theme === t}
                    onClick={() => setSetting("theme", t)}
                    className="flex-1 justify-center py-2.5 capitalize lg:text-[14px]"
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {settings.theme === "system" ? (
                <p className="mt-2 text-[10px] text-muted lg:text-[11.5px]">
                  Following your device, which is currently {dark ? "dark" : "light"}.
                </p>
              ) : null}
            </div>
            <Row icon={<Vibrate className="h-[18px] w-[18px]" />} title="Reduced motion" hint="Trim animations across the app">
              <Toggle
                checked={settings.reducedMotion}
                onChange={(v) => setSetting("reducedMotion", v)}
                label="Reduced motion"
              />
            </Row>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Notifications</p>
          <div className="card divide-y divide-line overflow-hidden">
            <Row
              icon={<Bell className="h-[18px] w-[18px]" />}
              title="Push notifications"
              hint={
                pushReady
                  ? "Background reminders are enabled on this device"
                  : pushError
                    ? pushError
                    : permission === "denied"
                      ? "Notifications are blocked in this browser's settings"
                      : permission === "unsupported"
                        ? "This browser does not support system notifications"
                        : permission === "granted"
                          ? "Permission is on; finish setting up background push"
                          : "Allow the browser prompt to get alerts"
              }
            >
              <Toggle
                checked={settings.notifications}
                onChange={(v) => {
                  setSetting("notifications", v);
                  if (v) void enableAlerts();
                  if (v) haptic("nudge", true);
                }}
                label="Push notifications"
              />
            </Row>
            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-cream lg:px-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-inksoft">
                <Inbox className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink lg:text-[15px]">
                  Notification inbox
                </span>
                <span className="block text-[10.5px] text-muted lg:text-[12px]">
                  {unread > 0 ? `${unread} unread` : "Streaks and the onWards you capture"}
                </span>
              </span>
              {unread > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
            <Row icon={<Mail className="h-[18px] w-[18px]" />} title="Weekly digest" hint="A Sunday recap of your onWards">
              <Toggle
                checked={settings.weeklyDigest}
                onChange={(v) => setSetting("weeklyDigest", v)}
                label="Weekly digest"
              />
            </Row>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Interaction</p>
          <div className="card divide-y divide-line overflow-hidden">
            <Row
              icon={<CalendarHeart className="h-[18px] w-[18px]" />}
              title="Haptic feedback"
              hint={
                vibrates === false
                  ? "This browser has no vibration API — Android and the installed app buzz"
                  : "Buzz when you capture an onWard or tap through the app"
              }
            >
              <Toggle
                checked={settings.haptics}
                onChange={(v) => {
                  setSetting("haptics", v);
                  haptic("success", v);
                }}
                label="Haptic feedback"
              />
            </Row>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Account</p>
          <div className="card divide-y divide-line overflow-hidden">
            <Row
              icon={<AtSign className="h-[18px] w-[18px]" />}
              title="Signed in as"
              hint={user?.email ?? "Not signed in"}
            />
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={doSignOut}
              disabled={leaving}
              iconLeft={<LogOut className="h-4 w-4" />}
            >
              {leaving ? "Signing out…" : "Sign out"}
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted lg:text-[12px]">
            Your onWards stay on your account. Nothing is shared unless you share it.
          </p>
        </section>
      </div>
    </PhoneShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button, Chip, PageHeader, Toggle } from "@/components/ui";
import { ProBadge } from "@/components/pro";
import { useStore } from "@/components/store";
import { useAuth } from "@/components/auth";
import {
  AtSign,
  Bell,
  CalendarHeart,
  Crown,
  LogOut,
  Mail,
  Moon,
  Sun,
  Timer,
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
  const [leaving, setLeaving] = useState(false);

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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
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
                : "3 onWards/mo, 1 share link, reminders on 3 tasks."}
            </span>
          </span>
          <button
            type="button"
            onClick={() => router.push("/upgrade")}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition lg:text-[13px] ${
              isPro
                ? "border border-line bg-paper text-ink hover:bg-cream"
                : "bg-lime text-ink hover:bg-lime-deep"
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
                  {settings.theme === "dark" ? (
                    <Moon className="h-[18px] w-[18px]" />
                  ) : (
                    <Sun className="h-[18px] w-[18px]" />
                  )}
                </span>
                <span className="text-[13px] font-bold text-ink lg:text-[15px]">Theme</span>
              </div>
              <div className="flex gap-2">
                {(["light", "dark"] as const).map((t) => (
                  <Chip
                    key={t}
                    active={settings.theme === t}
                    onClick={() => setSetting("theme", t)}
                    className="flex-1 justify-center py-2.5 capitalize lg:text-[14px]"
                  >
                    {t === "light" ? "Light" : "Dark"}
                  </Chip>
                ))}
              </div>
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
            <Row icon={<Bell className="h-[18px] w-[18px]" />} title="Push notifications" hint="Task reminders and daily nudges">
              <Toggle
                checked={settings.notifications}
                onChange={(v) => setSetting("notifications", v)}
                label="Push notifications"
              />
            </Row>
            <Row icon={<Mail className="h-[18px] w-[18px]" />} title="Weekly digest" hint="A Sunday recap of your onWards">
              <Toggle
                checked={settings.weeklyDigest}
                onChange={(v) => setSetting("weeklyDigest", v)}
                label="Weekly digest"
              />
            </Row>
            <Row icon={<Timer className="h-[18px] w-[18px]" />} title="Default reminder time">
              <input
                type="time"
                value={settings.defaultReminderTime}
                onChange={(e) => setSetting("defaultReminderTime", e.target.value)}
                aria-label="Default reminder time"
                className="rounded-lg border border-line bg-cream px-3 py-2 text-[13px] font-semibold text-ink outline-none lg:text-[14px]"
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
              hint="Buzz when you check off a task"
            >
              <Toggle checked={settings.haptics} onChange={(v) => setSetting("haptics", v)} label="Haptic feedback" />
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
            Your tasks, notes and onWards stay on your account. Nothing is shared unless you share it.
          </p>
        </section>
      </div>
    </PhoneShell>
  );
}

"use client";

import { supabase } from "@/lib/supabase";

type PushSchedule = {
  kind: "checklist" | "focus";
  eventId: string;
  scheduledAt: string;
  title: string;
  body: string;
  href: string;
  data?: Record<string, unknown>;
};

function decodeVapidKey(value: string): ArrayBuffer {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

async function request(path: string, method: "POST" | "DELETE", body: unknown) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Could not verify your session for push notifications.");
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to schedule push notifications.");

  const response = await fetch(path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error || "Push notification service is unavailable.");
  }
}

export async function registerPushSubscription(): Promise<void> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Background push is not configured for this app.");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Background push is not supported by this browser.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(vapidKey),
    });
  }
  await request("/api/push/subscriptions", "POST", subscription.toJSON());
}

export async function schedulePushNotification(schedule: PushSchedule): Promise<void> {
  await request("/api/push/schedules", "POST", schedule);
}

export async function cancelPushNotification(
  kind: PushSchedule["kind"],
  eventId: string,
): Promise<void> {
  await request("/api/push/schedules", "DELETE", { kind, eventId });
}

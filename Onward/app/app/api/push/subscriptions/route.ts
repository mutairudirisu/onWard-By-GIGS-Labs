import { authenticatePushRequest, isResponse } from "@/lib/push-server";

export const runtime = "nodejs";

type PushSubscriptionPayload = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

function validSubscription(value: unknown): value is PushSubscriptionPayload {
  if (!value || typeof value !== "object") return false;
  const subscription = value as PushSubscriptionPayload;
  return (
    typeof subscription.endpoint === "string" &&
    subscription.endpoint.startsWith("https://") &&
    subscription.endpoint.length <= 2048 &&
    typeof subscription.keys?.p256dh === "string" &&
    subscription.keys.p256dh.length <= 200 &&
    typeof subscription.keys.auth === "string" &&
    subscription.keys.auth.length <= 100
  );
}

export async function POST(request: Request) {
  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  let subscription: unknown;
  try {
    subscription = await request.json();
  } catch {
    return Response.json({ error: "Send a valid push subscription." }, { status: 400 });
  }
  if (!validSubscription(subscription)) {
    return Response.json({ error: "The push subscription is invalid." }, { status: 400 });
  }

  const { error } = await auth.admin.from("push_subscriptions").upsert(
    {
      user_id: auth.user.id,
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.error("Could not save push subscription", error.message);
    return Response.json({ error: "Could not save this device for push notifications." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  let endpoint: unknown;
  try {
    endpoint = (await request.json()).endpoint;
  } catch {
    return Response.json({ error: "Send a valid push endpoint." }, { status: 400 });
  }
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 2048) {
    return Response.json({ error: "The push endpoint is invalid." }, { status: 400 });
  }

  const { error } = await auth.admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("endpoint", endpoint);
  if (error) {
    console.error("Could not remove push subscription", error.message);
    return Response.json({ error: "Could not remove this device from push notifications." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

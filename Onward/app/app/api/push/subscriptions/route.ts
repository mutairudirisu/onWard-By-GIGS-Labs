import { authenticatePushRequest, isResponse } from "@/lib/push-server";
import { z } from "zod";
import {
  enforceIpRateLimit,
  enforceUserRateLimit,
  readJsonWithinLimit,
} from "@/lib/api-security";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;
const httpsEndpointSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => value.startsWith("https://"));
const subscriptionSchema = z
  .object({
    endpoint: httpsEndpointSchema,
    keys: z
      .object({
        p256dh: z.string().min(1).max(200),
        auth: z.string().min(1).max(100),
      })
      .passthrough(),
  })
  .passthrough();
const deletePayloadSchema = z.object({ endpoint: httpsEndpointSchema }).strict();

export async function POST(request: Request) {
  const ipLimitResponse = await enforceIpRateLimit(request, "push_subscriptions");
  if (ipLimitResponse) return ipLimitResponse;

  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  const rateLimitResponse = await enforceUserRateLimit(auth.accessToken, "push_subscriptions");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJsonWithinLimit(request, MAX_BODY_BYTES, "Send a valid push subscription.");
  if (!body.ok) return body.response;
  const parsedSubscription = subscriptionSchema.safeParse(body.value);
  if (!parsedSubscription.success) {
    return Response.json({ error: "The push subscription is invalid." }, { status: 400 });
  }
  const subscription = parsedSubscription.data;

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
  const ipLimitResponse = await enforceIpRateLimit(request, "push_subscriptions");
  if (ipLimitResponse) return ipLimitResponse;

  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  const rateLimitResponse = await enforceUserRateLimit(auth.accessToken, "push_subscriptions");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJsonWithinLimit(request, MAX_BODY_BYTES, "Send a valid push endpoint.");
  if (!body.ok) return body.response;
  const parsedPayload = deletePayloadSchema.safeParse(body.value);
  if (!parsedPayload.success) {
    return Response.json({ error: "The push endpoint is invalid." }, { status: 400 });
  }

  const { endpoint } = parsedPayload.data;
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

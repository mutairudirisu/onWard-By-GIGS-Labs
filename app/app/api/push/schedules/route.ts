import { authenticatePushRequest, isResponse } from "@/lib/push-server";
import { z } from "zod";
import {
  enforceIpRateLimit,
  enforceUserRateLimit,
  readJsonWithinLimit,
} from "@/lib/api-security";

export const runtime = "nodejs";

const EVENT_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const PATH = /^\/(?!\/)[^\s]*$/;
const MAX_BODY_BYTES = 16_384;
const scheduleCommonSchema = {
  eventId: z.string().regex(EVENT_ID),
  scheduledAt: z.string().refine((value) => {
    const at = Date.parse(value);
    return Number.isFinite(at) && at > Date.now() && at < Date.now() + 366 * 24 * 60 * 60 * 1000;
  }),
  title: z.string().trim().min(1).max(120),
  body: z.string().max(300),
  href: z.string().regex(PATH),
};
const schedulePayloadSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("checklist"),
      ...scheduleCommonSchema,
      data: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional(),
    })
    .passthrough(),
  z
    .object({
      kind: z.literal("focus"),
      ...scheduleCommonSchema,
      data: z
        .object({
          durationMinutes: z.number().int().min(5).max(60),
          focusTitle: z.string().trim().min(1).max(80),
        })
        .passthrough(),
    })
    .passthrough(),
]);
const deletePayloadSchema = z
  .object({
    kind: z.enum(["checklist", "focus"]),
    eventId: z.string().regex(EVENT_ID),
  })
  .strict();

export async function POST(request: Request) {
  const ipLimitResponse = await enforceIpRateLimit(request, "push_schedules");
  if (ipLimitResponse) return ipLimitResponse;

  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  const rateLimitResponse = await enforceUserRateLimit(auth.accessToken, "push_schedules");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJsonWithinLimit(request, MAX_BODY_BYTES, "Send a valid reminder schedule.");
  if (!body.ok) return body.response;
  const parsedInput = schedulePayloadSchema.safeParse(body.value);
  if (!parsedInput.success) {
    return Response.json({ error: "The reminder details are invalid or the time is not in the future." }, { status: 400 });
  }
  const input = parsedInput.data;
  const storedData =
    input.kind === "focus"
      ? {
          scheduleId: input.eventId,
          focusTitle: input.data.focusTitle,
          durationMinutes: input.data.durationMinutes,
        }
      : {};

  const { error } = await auth.admin.from("push_jobs").upsert(
    {
      id: `${input.kind}:${auth.user.id}:${input.eventId}`,
      user_id: auth.user.id,
      kind: input.kind,
      scheduled_at: new Date(input.scheduledAt as string).toISOString(),
      title: (input.title as string).trim(),
      body: (input.body as string).trim(),
      href: input.href,
      data: storedData,
      attempts: 0,
      claimed_until: null,
      sent_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("Could not save push schedule", error.message);
    return Response.json({ error: "Could not schedule this notification." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ipLimitResponse = await enforceIpRateLimit(request, "push_schedules");
  if (ipLimitResponse) return ipLimitResponse;

  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  const rateLimitResponse = await enforceUserRateLimit(auth.accessToken, "push_schedules");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJsonWithinLimit(request, MAX_BODY_BYTES, "Send the reminder identifier.");
  if (!body.ok) return body.response;
  const parsedInput = deletePayloadSchema.safeParse(body.value);
  if (!parsedInput.success) {
    return Response.json({ error: "The reminder identifier is invalid." }, { status: 400 });
  }

  const { kind, eventId } = parsedInput.data;
  const id = `${kind}:${auth.user.id}:${eventId}`;
  const { error } = await auth.admin
    .from("push_jobs")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .is("sent_at", null);
  if (error) {
    console.error("Could not cancel push schedule", error.message);
    return Response.json({ error: "Could not cancel this notification." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

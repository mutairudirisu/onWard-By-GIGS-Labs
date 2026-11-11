import { authenticatePushRequest, isResponse } from "@/lib/push-server";

export const runtime = "nodejs";

const EVENT_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const PATH = /^\/(?!\/)[^\s]*$/;

type SchedulePayload = {
  kind?: unknown;
  eventId?: unknown;
  scheduledAt?: unknown;
  title?: unknown;
  body?: unknown;
  href?: unknown;
  data?: unknown;
};

function validSchedule(value: unknown): value is SchedulePayload {
  if (!value || typeof value !== "object") return false;
  const schedule = value as SchedulePayload;
  const at = typeof schedule.scheduledAt === "string" ? Date.parse(schedule.scheduledAt) : NaN;
  return (
    (schedule.kind === "checklist" || schedule.kind === "focus") &&
    typeof schedule.eventId === "string" &&
    EVENT_ID.test(schedule.eventId) &&
    Number.isFinite(at) &&
    at > Date.now() &&
    at < Date.now() + 366 * 24 * 60 * 60 * 1000 &&
    typeof schedule.title === "string" &&
    schedule.title.trim().length > 0 &&
    schedule.title.length <= 120 &&
    typeof schedule.body === "string" &&
    schedule.body.length <= 300 &&
    typeof schedule.href === "string" &&
    PATH.test(schedule.href) &&
    (schedule.data === undefined || (typeof schedule.data === "object" && schedule.data !== null))
  );
}

export async function POST(request: Request) {
  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a valid reminder schedule." }, { status: 400 });
  }
  if (!validSchedule(input)) {
    return Response.json({ error: "The reminder details are invalid or the time is not in the future." }, { status: 400 });
  }

  const data = input.data as Record<string, unknown> | undefined;
  if (
    input.kind === "focus" &&
    (typeof data?.durationMinutes !== "number" ||
      !Number.isInteger(data.durationMinutes) ||
      data.durationMinutes < 5 ||
      data.durationMinutes > 60 ||
      typeof data.focusTitle !== "string" ||
      !data.focusTitle.trim() ||
      data.focusTitle.length > 80)
  ) {
    return Response.json({ error: "The focus session title or duration is invalid." }, { status: 400 });
  }

  const storedData =
    input.kind === "focus"
      ? {
          scheduleId: input.eventId,
          focusTitle: (data!.focusTitle as string).trim(),
          durationMinutes: data!.durationMinutes,
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
  const auth = await authenticatePushRequest(request);
  if (isResponse(auth)) return auth;

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send the reminder identifier." }, { status: 400 });
  }
  if (!input || typeof input !== "object") {
    return Response.json({ error: "Send the reminder identifier." }, { status: 400 });
  }
  const value = input as { kind?: unknown; eventId?: unknown };
  if (
    (value.kind !== "checklist" && value.kind !== "focus") ||
    typeof value.eventId !== "string" ||
    !EVENT_ID.test(value.eventId)
  ) {
    return Response.json({ error: "The reminder identifier is invalid." }, { status: 400 });
  }

  const id = `${value.kind}:${auth.user.id}:${value.eventId}`;
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

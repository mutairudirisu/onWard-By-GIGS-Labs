import { timingSafeEqual } from "node:crypto";
import { sendNotification, setVapidDetails } from "web-push";
import { enforceIpRateLimit, logAuthenticationFailure } from "@/lib/api-security";
import { serverPushConfig } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PushJob = {
  id: string;
  user_id: string;
  kind:
    | "checklist"
    | "focus"
    | "broadcast"
    | "post"
    | "comment"
    | "reply"
    | "connection_request";
  scheduled_at: string;
  title: string;
  body: string;
  href: string;
  data: Record<string, unknown>;
  attempts: number;
};

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const ipLimitResponse = await enforceIpRateLimit(request, "cron_push");
  if (ipLimitResponse) return ipLimitResponse;
  if (!authorized(request)) {
    logAuthenticationFailure(request, "/api/cron/push", "invalid_bearer_token");
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = serverPushConfig();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!config || !publicKey || !privateKey || !subject) {
    return Response.json({ error: "Web Push is not configured on the server." }, { status: 503 });
  }
  setVapidDetails(subject, publicKey, privateKey);

  const { error: automationError } = await config.admin.rpc("enqueue_automated_push_jobs", {
    p_now: new Date().toISOString(),
  });
  let automationUnavailable = false;
  if (automationError) {
    if (automationError.code === "PGRST202") {
      automationUnavailable = true;
      console.warn("Automated push scheduling is unavailable; processing queued notifications.");
    } else {
      console.error("Could not enqueue automated push notifications", automationError.message);
      return Response.json({ error: "Could not schedule automated notifications." }, { status: 500 });
    }
  }

  const { data, error } = await config.admin.rpc("claim_due_push_jobs", { p_limit: 100 });
  if (error) {
    console.error("Could not claim due push jobs", error.message);
    return Response.json({ error: "Could not load due notifications." }, { status: 500 });
  }

  const jobs = (data ?? []) as PushJob[];
  let sent = 0;
  let retried = 0;
  for (const job of jobs) {
    try {
      const { data: preference, error: preferenceError } = await config.admin
        .from("user_settings")
        .select("notifications")
        .eq("user_id", job.user_id)
        .maybeSingle();
      if (preferenceError) throw preferenceError;

      const { data: subscriptions, error: subscriptionsError } = await config.admin
        .from("push_subscriptions")
        .select("endpoint, subscription")
        .eq("user_id", job.user_id);
      if (subscriptionsError) throw subscriptionsError;

      const payload = JSON.stringify({
        ...job.data,
        title: job.title,
        body: job.body,
        tag: job.id,
        href: job.href,
        kind: job.kind,
        scheduledAt: job.scheduled_at,
      });

      if (preference?.notifications !== false) {
        const results = await Promise.allSettled(
          (subscriptions ?? []).map(async (row) => {
            try {
              await sendNotification(row.subscription, payload, { TTL: 86_400 });
            } catch (error) {
              const statusCode =
                typeof error === "object" && error !== null && "statusCode" in error
                  ? Number(error.statusCode)
                  : 0;
              if (statusCode === 404 || statusCode === 410) {
                const { error: deleteError } = await config.admin
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", row.endpoint);
                if (deleteError) throw deleteError;
                return;
              }
              throw error;
            }
          }),
        );
        const failures = results.filter((result) => result.status === "rejected");
        if (failures.length && job.attempts < 5) {
          const message = "One or more push endpoints temporarily failed.";
          const { error: retryError } = await config.admin
            .from("push_jobs")
            .update({ claimed_until: null, last_error: message })
            .eq("id", job.id);
          if (retryError) throw retryError;
          retried += 1;
          continue;
        }
        if (failures.length) console.error("Push job exhausted retries", job.id);
      }

      const { error: finishError } = await config.admin
        .from("push_jobs")
        .update({ sent_at: new Date().toISOString(), claimed_until: null, last_error: null })
        .eq("id", job.id);
      if (finishError) throw finishError;
      sent += 1;
    } catch (error) {
      const message =
        error instanceof Error ? `Push delivery failed (${error.name}).` : "Push delivery failed.";
      const update = await config.admin
        .from("push_jobs")
        .update({
          claimed_until: job.attempts < 5 ? null : new Date().toISOString(),
          sent_at: job.attempts >= 5 ? new Date().toISOString() : null,
          last_error: message,
        })
        .eq("id", job.id);
      if (update.error) console.error("Could not record push failure", job.id, update.error.message);
      else if (job.attempts < 5) retried += 1;
      console.error("Push delivery failed", job.id, error instanceof Error ? error.name : "UnknownError");
    }
  }

  return Response.json({
    processed: jobs.length,
    sent,
    retried,
    ...(automationUnavailable
      ? { warning: "Automated push scheduling is unavailable; queued notifications were processed." }
      : {}),
  });
}

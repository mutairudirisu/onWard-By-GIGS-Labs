import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";

export type RateLimitedAction =
  | "proofread"
  | "transcribe"
  | "push_subscriptions"
  | "push_schedules"
  | "cron_push";

type UserRateLimitedAction = Exclude<RateLimitedAction, "cron_push">;

type BodyResult = { ok: true; bytes: Uint8Array } | { ok: false; response: Response };

export async function readBodyWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<BodyResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return {
        ok: false,
        response: Response.json({ error: "The request body is invalid." }, { status: 400 }),
      };
    }
    if (declaredLength > maxBytes) {
      return {
        ok: false,
        response: Response.json({ error: "The request body is too large." }, { status: 413 }),
      };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, bytes: new Uint8Array() };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch (error) {
          console.warn(
            "Could not cancel oversized request body",
            error instanceof Error ? error.name : "UnknownError",
          );
        }
        return {
          ok: false,
          response: Response.json({ error: "The request body is too large." }, { status: 413 }),
        };
      }
      chunks.push(value);
    }
  } catch (error) {
    console.warn("Could not read request body", error instanceof Error ? error.name : "UnknownError");
    return {
      ok: false,
      response: Response.json({ error: "The request body could not be read." }, { status: 400 }),
    };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export async function readJsonWithinLimit(
  request: Request,
  maxBytes: number,
  invalidMessage: string,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const body = await readBodyWithinLimit(request, maxBytes);
  if (!body.ok) return body;

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(body.bytes)) as unknown };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return {
      ok: false,
      response: Response.json({ error: invalidMessage }, { status: 400 }),
    };
  }
}

export async function enforceUserRateLimit(
  accessToken: string,
  action: UserRateLimitedAction,
): Promise<Response | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json({ error: "Rate limiting is not configured on this server." }, { status: 503 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await supabase.rpc("consume_user_api_rate_limit", {
    p_action: action,
  });
  if (error) {
    console.error("API rate-limit check failed", error.message);
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  const decision = Array.isArray(data) ? data[0] : null;
  if (
    !decision ||
    typeof decision !== "object" ||
    !("allowed" in decision) ||
    typeof decision.allowed !== "boolean" ||
    !("retry_after_seconds" in decision) ||
    typeof decision.retry_after_seconds !== "number"
  ) {
    console.error("API rate-limit check returned an invalid response");
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  if (decision.allowed) return null;
  const retryAfter = Math.max(1, Math.ceil(decision.retry_after_seconds));
  return Response.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function enforceIpRateLimit(
  request: Request,
  action: RateLimitedAction,
): Promise<Response | null> {
  const forwardedIp = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (!forwardedIp && process.env.NODE_ENV !== "production") return null;
  if (!forwardedIp || !isIP(forwardedIp)) {
    console.error("Could not determine a trusted client IP for rate limiting", { action });
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("IP rate limiting is not configured", { action });
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  const ipHash = createHmac("sha256", serviceRoleKey).update(forwardedIp).digest("hex");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("consume_ip_api_rate_limit", {
    p_ip_hash: ipHash,
    p_action: action,
  });
  if (error) {
    console.error("IP rate-limit check failed", { action, message: error.message });
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  const decision = Array.isArray(data) ? data[0] : null;
  if (
    !decision ||
    typeof decision !== "object" ||
    !("allowed" in decision) ||
    typeof decision.allowed !== "boolean" ||
    !("retry_after_seconds" in decision) ||
    typeof decision.retry_after_seconds !== "number"
  ) {
    console.error("IP rate-limit check returned an invalid response", { action });
    return Response.json({ error: "This request could not be processed right now." }, { status: 503 });
  }

  if (decision.allowed) return null;
  const retryAfter = Math.max(1, Math.ceil(decision.retry_after_seconds));
  return Response.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function logAuthenticationFailure(
  request: Request,
  endpoint: string,
  reason: "missing_bearer_token" | "invalid_bearer_token",
) {
  const requestId = request.headers.get("x-vercel-id")?.slice(0, 128);
  console.warn("Authentication failure", { endpoint, reason, requestId });
}

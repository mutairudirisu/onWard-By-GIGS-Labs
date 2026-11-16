import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.enum(["check", "users", "overview", "feedback", "automations"]);
const updateAutomationSchema = z.object({
  id: z.enum(["monday_motivation", "daily_checkin", "friday_reflection", "long_absence"]),
  enabled: z.boolean(),
  localTime: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .refine((value) => value >= "08:00" && value < "20:00"),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(300),
});

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const parsedAction = actionSchema.safeParse(new URL(request.url).searchParams.get("action"));
  if (!parsedAction.success) return jsonResponse({ error: "The requested admin resource is invalid." }, 400);
  const access = await authorizeAdmin(request);
  if (access instanceof Response) return access;
  if (parsedAction.data === "check") return jsonResponse({ isAdmin: true });

  const rpcName = {
    users: "admin_users",
    overview: "admin_overview",
    feedback: "admin_feedback",
    automations: "admin_push_automations",
  }[parsedAction.data];
  const { data, error } = await access.client.rpc(rpcName);
  if (error) {
    console.error("Admin data request failed", { action: parsedAction.data, message: error.message });
    return jsonResponse({ error: "Could not load the requested admin data." }, 500);
  }
  return jsonResponse(data);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) return jsonResponse({ error: "The request is too large." }, 413);

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return jsonResponse({ error: "Send valid JSON." }, 400);
  }
  const input = updateAutomationSchema.safeParse(value);
  if (!input.success) return jsonResponse({ error: "The automation settings are invalid." }, 400);

  const access = await authorizeAdmin(request);
  if (access instanceof Response) return access;
  const { error } = await access.client.rpc("admin_update_push_automation", {
    p_id: input.data.id,
    p_enabled: input.data.enabled,
    p_local_time: input.data.localTime,
    p_title: input.data.title,
    p_body: input.data.body,
  });
  if (error) {
    console.error("Admin automation update failed", error.message);
    return jsonResponse({ error: "Could not save this notification automation." }, 500);
  }
  return jsonResponse({ ok: true });
}

async function authorizeAdmin(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token || token.length > 8192) {
    console.warn("Admin API authentication failure", {
      reason: "missing_or_invalid_bearer_token",
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Sign in to continue." }, 401);
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: authError } = await client.auth.getUser(token);
  if (authError || !userData.user) {
    console.warn("Admin API authentication failure", {
      reason: "invalid_bearer_token",
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Your session has expired. Sign in again." }, 401);
  }

  const { data: isAdmin, error: adminError } = await client.rpc("admin_me");
  if (adminError) {
    console.error("Admin authorization check failed", adminError.message);
    return jsonResponse({ error: "Could not verify admin access." }, 503);
  }
  if (isAdmin !== true) {
    console.warn("Admin API authorization failure", {
      userId: userData.user.id,
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Admin access is required." }, 403);
  }
  return { client, userId: userData.user.id };
}

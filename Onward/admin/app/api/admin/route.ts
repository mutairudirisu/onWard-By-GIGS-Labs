import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.enum(["check", "users", "overview", "feedback"]);

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const parsedAction = actionSchema.safeParse(new URL(request.url).searchParams.get("action"));
  if (!parsedAction.success) return jsonResponse({ error: "The requested admin resource is invalid." }, 400);

  const token = request.headers.get("authorization")?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token || token.length > 8192) {
    console.warn("Admin API authentication failure", {
      reason: "missing_or_invalid_bearer_token",
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Sign in to continue." }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    console.warn("Admin API authentication failure", {
      reason: "invalid_bearer_token",
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Your session has expired. Sign in again." }, 401);
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("admin_me");
  if (adminError) {
    console.error("Admin authorization check failed", adminError.message);
    return jsonResponse({ error: "Could not verify admin access." }, 503);
  }
  if (isAdmin !== true) {
    console.warn("Admin API authorization failure", {
      userId: userData.user.id,
      action: parsedAction.data,
      requestId: request.headers.get("x-vercel-id")?.slice(0, 128),
    });
    return jsonResponse({ error: "Admin access is required." }, 403);
  }
  if (parsedAction.data === "check") return jsonResponse({ isAdmin: true });

  const rpcName = {
    users: "admin_users",
    overview: "admin_overview",
    feedback: "admin_feedback",
  }[parsedAction.data];
  const { data, error } = await supabase.rpc(rpcName);
  if (error) {
    console.error("Admin data request failed", { action: parsedAction.data, message: error.message });
    return jsonResponse({ error: "Could not load the requested admin data." }, 500);
  }
  return jsonResponse(data);
}

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export function serverPushConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;

  const auth = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { auth, admin };
}

export async function authenticatePushRequest(
  request: Request,
): Promise<{ user: User; admin: SupabaseClient } | Response> {
  const config = serverPushConfig();
  if (!config) {
    return Response.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return Response.json({ error: "Sign in to manage push notifications." }, { status: 401 });

  const { data, error } = await config.auth.auth.getUser(token);
  if (error || !data.user) {
    return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }
  return { user: data.user, admin: config.admin };
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

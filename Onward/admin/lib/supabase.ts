import { createClient } from "@supabase/supabase-js";

// The anon key is safe in the browser: every privileged read goes through
// SECURITY DEFINER functions that check public.admins membership.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lakpaqruemdjyvwprfme.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxha3BhcXJ1ZW1kanl2d3ByZm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDgzMTAsImV4cCI6MjEwNjI4NDMxMH0.nrcZ348wO4IyBm1tLgYVdhJ6BRrgEaip5JPmeWWlvCk";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

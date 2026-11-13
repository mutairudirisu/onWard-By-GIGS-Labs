import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  enforceIpRateLimit,
  enforceUserRateLimit,
  logAuthenticationFailure,
  readBodyWithinLimit,
} from "@/lib/api-security";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 4_000_000;
const MAX_MULTIPART_BYTES = MAX_AUDIO_BYTES + 100_000;
const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);
const audioSchema = z
  .custom<File>((value): value is File => typeof File !== "undefined" && value instanceof File)
  .refine((file) => file.size > 0, { message: "empty" })
  .refine((file) => file.size <= MAX_AUDIO_BYTES, { message: "too_large" })
  .refine((file) => AUDIO_TYPES.has(file.type.toLowerCase().split(";")[0]), {
    message: "unsupported_type",
  });
const languageSchema = z.string().regex(/^[a-z]{2,3}(?:-[a-z]{2,4})?$/i).optional();

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const ipLimitResponse = await enforceIpRateLimit(request, "transcribe");
  if (ipLimitResponse) return ipLimitResponse;

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    logAuthenticationFailure(request, "/api/transcribe", "missing_bearer_token");
    return jsonError("Sign in to use voice dictation.", 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Authentication is not configured on this server.", 500);
  }
  const auth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) {
    logAuthenticationFailure(request, "/api/transcribe", "invalid_bearer_token");
    return jsonError("Your session has expired. Sign in again.", 401);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError("Recorded dictation is not configured on this server.", 503);

  const rateLimitResponse = await enforceUserRateLimit(token, "transcribe");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readBodyWithinLimit(request, MAX_MULTIPART_BYTES);
  if (!body.ok) return body.response;

  const formBody = new ArrayBuffer(body.bytes.byteLength);
  new Uint8Array(formBody).set(body.bytes);
  let form: FormData;
  try {
    form = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: formBody,
    }).formData();
  } catch {
    return jsonError("Send a recorded audio clip to transcribe.", 400);
  }

  const audioResult = audioSchema.safeParse(form.get("audio"));
  if (!audioResult.success) {
    switch (audioResult.error.issues[0]?.message) {
      case "empty":
        return jsonError("The audio recording is empty. Try recording again.", 400);
      case "too_large":
        return jsonError("This recording is too large. Keep it under 4 MB and try again.", 413);
      case "unsupported_type":
        return jsonError("This browser's recording format is not supported. Try another browser.", 415);
      default:
        return jsonError("Send a recorded audio clip to transcribe.", 400);
    }
  }

  const audio = audioResult.data;
  const rawLanguage = form.get("language");
  const languageResult = languageSchema.safeParse(
    typeof rawLanguage === "string" && rawLanguage.length > 0 ? rawLanguage : undefined,
  );
  if (!languageResult.success) return jsonError("The language code is invalid.", 400);
  const languageCode = languageResult.data?.slice(0, 2).toLowerCase();

  const payload = new FormData();
  payload.append("file", audio, audio.name);
  payload.append("model", "whisper-1");
  payload.append("response_format", "json");
  if (languageCode) payload.append("language", languageCode);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: payload,
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonError("Transcription took too long. Please try recording again.", 504);
    }
    return jsonError("Could not reach the transcription service. Please try again.", 502);
  }

  const result = (await response.json().catch(() => null)) as
    | { text?: unknown }
    | null;
  if (!response.ok) {
    if (response.status === 429) {
      return jsonError("The transcription service is busy. Please try again shortly.", 503);
    }
    console.error("Speech transcription request failed", response.status);
    return jsonError("The transcription service could not process this recording.", 502);
  }
  if (typeof result?.text !== "string" || !result.text.trim()) {
    return jsonError("No speech was detected. Tap the mic to try again.", 422);
  }

  return Response.json({ text: result.text.trim() });
}

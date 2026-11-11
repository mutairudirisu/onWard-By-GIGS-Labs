import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Vercel serverless functions cap inbound request bodies at roughly 4.5 MB.
const MAX_AUDIO_BYTES = 4_000_000;
const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonError("Sign in to use voice dictation.", 401);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Authentication is not configured on this server.", 500);
  }
  const auth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return jsonError("Your session has expired. Sign in again.", 401);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError("Recorded dictation is not configured on this server.", 503);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES + 100_000) {
    return jsonError("This recording is too large. Keep it under 4 MB and try again.", 413);
  }

  let audio: FormDataEntryValue | null;
  let language: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    audio = form.get("audio");
    language = form.get("language");
  } catch {
    return jsonError("Send a recorded audio clip to transcribe.", 400);
  }

  if (!(audio instanceof File) || !audio.size) {
    return jsonError("The audio recording is empty. Try recording again.", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonError("This recording is too large. Keep it under 4 MB and try again.", 413);
  }
  const contentType = audio.type.toLowerCase().split(";")[0];
  if (!AUDIO_TYPES.has(contentType)) {
    return jsonError("This browser's recording format is not supported. Try another browser.", 415);
  }

  const languageCode =
    typeof language === "string" && /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i.test(language)
      ? language.slice(0, 2).toLowerCase()
      : undefined;
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

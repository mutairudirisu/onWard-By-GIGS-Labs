"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechAlternative };
type SpeechResultList = { length: number; [index: number]: SpeechResult };
type SpeechResultEvent = { resultIndex: number; results: SpeechResultList };
type SpeechErrorEvent = { error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function recorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function transcribeAudio(
  blob: Blob,
  language: string,
  signal: AbortSignal,
): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Could not verify your session for dictation.");
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to use voice dictation.");

  const extension = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append(
    "audio",
    new File([blob], `dictation.${extension}`, { type: blob.type || "audio/webm" }),
  );
  form.append("language", language);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
    signal,
  });
  const result = (await response.json().catch(() => null)) as
    | { text?: string; error?: string }
    | null;
  if (!response.ok) throw new Error(result?.error || "Could not transcribe this recording.");
  if (!result?.text?.trim()) throw new Error("No speech was detected. Tap the mic to try again.");
  return result.text.trim();
}

// Appends a dictated phrase to existing text without stacking spaces.
export function appendDictation(current: string, text: string) {
  const clean = text.trim();
  if (!clean) return current;
  const head = current.trimEnd();
  if (!head) return clean;
  return `${head} ${clean}`;
}

export function useDictation(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const stoppingRef = useRef(false);
  const interimRef = useRef("");
  const modeRef = useRef<"native" | "recorded" | null>(null);
  const languageRef = useRef("en-US");

  const updateInterim = useCallback((text: string) => {
    interimRef.current = text;
    setInterim(text);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()) || Boolean(recorderMimeType()));
    return () => {
      stoppingRef.current = true;
      recognitionRef.current?.abort();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      abortRef.current?.abort();
    };
  }, []);

  const startRecorded = useCallback(async () => {
    if (!recorderMimeType() || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice dictation is not supported by this browser.");
      return;
    }

    stoppingRef.current = false;
    chunksRef.current = [];
    setError(null);
    setInterim("");
    setTranscribing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stoppingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const mimeType = recorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      modeRef.current = "recorded";
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stoppingRef.current = true;
        recorderRef.current = null;
        chunksRef.current = [];
        releaseStream();
        setListening(false);
        setTranscribing(false);
        setError("Recording failed. Check microphone access and try again.");
      };
      recorder.onstop = () => {
        recorderRef.current = null;
        releaseStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        chunksRef.current = [];
        if (stoppingRef.current || !blob.size) {
          setListening(false);
          setTranscribing(false);
          return;
        }

        const controller = new AbortController();
        abortRef.current = controller;
        setListening(false);
        setTranscribing(true);
        void transcribeAudio(blob, languageRef.current, controller.signal)
          .then((text) => {
            if (!controller.signal.aborted) onTextRef.current(text);
          })
          .catch((transcriptionError: unknown) => {
            if (controller.signal.aborted) return;
            setError(
              transcriptionError instanceof Error
                ? transcriptionError.message
                : "Could not transcribe the recording. Tap the mic to retry.",
            );
          })
          .finally(() => {
            if (abortRef.current === controller) abortRef.current = null;
            if (!controller.signal.aborted) setTranscribing(false);
          });
      };
      recorder.start(250);
      setListening(true);
    } catch (recordingError) {
      releaseStream();
      setListening(false);
      setError(
        recordingError instanceof DOMException &&
          (recordingError.name === "NotAllowedError" || recordingError.name === "SecurityError")
          ? "Microphone access is blocked. Allow it in your browser settings."
          : recordingError instanceof Error && recordingError.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Couldn't start recording. Check microphone access and try again.",
      );
    }
  }, [releaseStream]);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    stoppingRef.current = false;
    setError(null);
    setInterim("");
    languageRef.current = document.documentElement.lang || navigator.language || "en-US";

    if (!Ctor) {
      void startRecorded();
      return;
    }

    modeRef.current = "native";
    if (!recognitionRef.current) {
      const recognition = new Ctor();
      recognition.lang = languageRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let final = "";
        let heard = "";
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            if (i >= event.resultIndex) final += transcript;
          } else {
            heard += transcript;
          }
        }
        updateInterim(heard.trim());
        if (final.trim()) onTextRef.current(final.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        stoppingRef.current = true;
        setListening(false);
        setError(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone access is blocked. Allow it in your browser settings."
            : event.error === "no-speech"
              ? "No speech was detected. Tap the mic to try again."
              : "Dictation stopped. Tap the mic to try again.",
        );
      };
      recognition.onend = () => {
        const pending = interimRef.current.trim();
        if (pending) onTextRef.current(pending);
        updateInterim("");
        setListening(false);
        if (!stoppingRef.current) {
          try {
            recognition.start();
            setListening(true);
          } catch {
            stoppingRef.current = true;
            setError("Dictation stopped. Tap the mic to try again.");
          }
        }
      };
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (startError) {
      if (startError instanceof DOMException && startError.name === "InvalidStateError") {
        setListening(true);
        return;
      }
      stoppingRef.current = true;
      setListening(false);
      setError("Couldn't start dictation. Check microphone access and try again.");
    }
  }, [startRecorded, updateInterim]);

  const stop = useCallback(() => {
    if (modeRef.current === "recorded") {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      return;
    }
    stoppingRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const cancel = useCallback(() => {
    stoppingRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
    recognitionRef.current?.abort();
    updateInterim("");
    setListening(false);
    setTranscribing(false);
  }, [releaseStream, updateInterim]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, transcribing, interim, error, start, stop, cancel, toggle };
}

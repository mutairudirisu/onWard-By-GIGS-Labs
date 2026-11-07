"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
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
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    return () => {
      stoppingRef.current = true;
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    stoppingRef.current = false;
    setError(null);

    if (!recognitionRef.current) {
      const recognition = new Ctor();
      recognition.lang = document.documentElement.lang || navigator.language || "en-US";
      recognition.continuous = true;
      // The words shown while you are still speaking come from here, which is what
      // makes the box keep up with the voice instead of filling in at the end.
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let final = "";
        let heard = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) final += transcript;
          else heard += transcript;
        }
        setInterim(heard.trim());
        const clean = final.trim();
        if (clean) {
          setInterim("");
          onTextRef.current(clean);
        }
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        stoppingRef.current = true;
        setListening(false);
        setError(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone access is blocked. Allow it in your browser settings."
            : "Dictation stopped. Tap the mic to try again.",
        );
      };
      // Chrome ends the session after a pause even in continuous mode; restart
      // it while the user still has dictation switched on.
      recognition.onend = () => {
        setListening(false);
        setInterim("");
        if (!stoppingRef.current) {
          try {
            recognition.start();
            setListening(true);
          } catch {
            /* engine refused to resume — user can tap again */
          }
        }
      };
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      /* already running */
    }
  }, []);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}

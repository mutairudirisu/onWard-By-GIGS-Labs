"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { Mic, Square, X } from "lucide-react";
import { appendDictation, useDictation } from "@/lib/dictation";

/** Each bar's own gain, so the row reads as a voice and not as one pulsing block. */
const WEIGHTS = [0.55, 1, 0.72, 0.94, 0.6, 0.86, 0.5];
const MIN_TEXTAREA_HEIGHT = 84;
const MAX_TEXTAREA_HEIGHT = 320;

/** Animate the recording strip without opening a second microphone stream. */
function useVoiceMeter(listening: boolean, strip: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!listening) return;

    let frame = 0;
    const from = performance.now();
    const tick = () => {
      const t = (performance.now() - from) / 1000;
      const level = 0.34 + 0.26 * Math.sin(t * 3.1) + 0.12 * Math.sin(t * 7.9);
      strip.current?.style.setProperty("--lv", level.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [listening, strip]);
}

/**
 * A field you can talk into. The mic only appears while the box is focused, so a form
 * full of half-finished thoughts is not also full of mics; once you tap it the bottom
 * edge of the same box turns into a meter that moves with your voice, with the words
 * arriving in the field and a stop button to hand it back.
 */
export function DictateTextArea({
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const { supported, listening, transcribing, interim, error, start, stop, cancel, toggle } = useDictation((text) => {
    const next = appendDictation(valueRef.current, text);
    valueRef.current = next;
    onChange(next);
  });
  const displayedValue = interim ? appendDictation(value, interim) : value;
  const active = listening || transcribing;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const height = Math.min(
      MAX_TEXTAREA_HEIGHT,
      Math.max(MIN_TEXTAREA_HEIGHT, textarea.scrollHeight),
    );
    textarea.style.height = `${height}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [displayedValue, active]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    valueRef.current = next;
    onChange(next);
    if (listening) toggle();
  }

  useVoiceMeter(listening, strip);

  if (!supported) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="field-input block min-h-[84px] resize-none overflow-hidden leading-[1.5]"
      />
    );
  }

  return (
    <div>
      {/* One box. While you speak, the meter and the stop button live in the field's own
          bottom edge rather than in a second strip underneath it. */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={displayedValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`field-input block min-h-[84px] resize-none overflow-hidden leading-[1.5] ${
            focused && !active ? "pr-11" : ""
          } ${active ? "pb-[54px]" : ""}`}
        />

        {active ? (
          <div
            ref={strip}
            className="absolute inset-x-px bottom-px flex items-center gap-2.5 rounded-b-[11px] border-t border-line px-2.5 py-1.5"
            style={{ ["--lv" as string]: "0" } as React.CSSProperties}
          >
            {listening ? (
              <span className="flex h-5 shrink-0 items-center gap-[3px]" aria-hidden>
                {WEIGHTS.map((weight, index) => (
                  <span
                    key={index}
                    className="h-5 w-[3px] rounded-full bg-lime-deep"
                    style={{ transform: `scaleY(calc(0.1 + var(--lv, 0) * ${weight}))` }}
                  />
                ))}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-[11px] leading-[1.4] text-muted" role="status">
              {transcribing ? "Transcribing…" : interim || "Listening…"}
            </span>
            {listening ? (
              <button
                type="button"
                aria-label="Stop dictating and transcribe"
                title="Stop dictating"
                onMouseDown={(event) => event.preventDefault()}
                onClick={stop}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#E5484D]/10 text-[#E5484D] transition hover:bg-[#E5484D]/20"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label={transcribing ? "Cancel transcription" : "Cancel dictation"}
              title="Cancel dictation"
              onMouseDown={(event) => event.preventDefault()}
              onClick={cancel}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : focused ? (
          <button
            type="button"
            aria-label={label}
            title={label}
            // The box keeps the caret the mic is about to speak into.
            onMouseDown={(event) => event.preventDefault()}
            onClick={error ? start : toggle}
            className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
          >
            <Mic className="h-[16px] w-[16px]" strokeWidth={2.2} />
          </button>
        ) : null}
      </div>

      {!active && error ? (
        <p role="alert" className="mt-1.5 text-[10px] leading-[1.4] text-[#E5484D]">{error}</p>
      ) : null}
    </div>
  );
}

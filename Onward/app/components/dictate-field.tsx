"use client";

import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { Mic, Square } from "lucide-react";
import { TextArea } from "@/components/ui";
import { appendDictation, useDictation } from "@/lib/dictation";

/** Each bar's own gain, so the row reads as a voice and not as one pulsing block. */
const WEIGHTS = [0.55, 1, 0.72, 0.94, 0.6, 0.86, 0.5];

/**
 * How loud you are, written straight onto the strip as `--lv` sixty times a second.
 * It never goes through React state because a re-render per frame would make the very
 * typing you are doing while it runs stutter.
 */
function useVoiceMeter(listening: boolean, strip: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!listening) return;

    let frame = 0;
    let closed: (() => void) | null = null;
    let done = false;

    const write = (level: number) => {
      strip.current?.style.setProperty("--lv", level.toFixed(3));
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      closed?.();
      closed = null;
    };

    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) {
      // No way to hear the level: keep the row moving so it still says "recording".
      const from = performance.now();
      const tick = () => {
        const t = (performance.now() - from) / 1000;
        write(0.34 + 0.26 * Math.sin(t * 3.1) + 0.12 * Math.sin(t * 7.9));
        frame = requestAnimationFrame(tick);
      };
      tick();
      return stop;
    }

    media
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (done) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const AudioCtor = window.AudioContext;
        if (!AudioCtor) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const context = new AudioCtor();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);

        closed = () => {
          stream.getTracks().forEach((track) => track.stop());
          void context.close();
        };

        const tick = () => {
          analyser.getByteTimeDomainData(samples);
          let sum = 0;
          for (const sample of samples) {
            const offset = (sample - 128) / 128;
            sum += offset * offset;
          }
          // Room tone sits near 0.02; the gain and the floor keep a quiet room from
          // looking dead while a normal voice still fills the row.
          const rms = Math.sqrt(sum / samples.length);
          write(Math.min(1, 0.08 + rms * 4.5));
          frame = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        if (done) return;
        const from = performance.now();
        const tick = () => {
          const t = (performance.now() - from) / 1000;
          write(0.3 + 0.24 * Math.sin(t * 3.1));
          frame = requestAnimationFrame(tick);
        };
        tick();
      });

    return () => {
      done = true;
      stop();
    };
  }, [listening, strip]);
}

/**
 * A field you can talk into. The mic only appears while the box is focused, so a form
 * full of half-finished thoughts is not also full of mics; once you tap it the box
 * hands over to the strip below, which moves with your voice and shows the words as
 * they arrive.
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
  const { supported, listening, interim, error, toggle } = useDictation((text) =>
    onChange(appendDictation(value, text)),
  );

  useVoiceMeter(listening, strip);

  if (!supported) {
    return (
      <TextArea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <div>
      <TextArea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        trailing={
          focused && !listening ? (
            <button
              type="button"
              aria-label={label}
              title={label}
              // The box keeps the caret the mic is about to speak into.
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggle}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
            >
              <Mic className="h-[16px] w-[16px]" strokeWidth={2.2} />
            </button>
          ) : undefined
        }
      />

      {listening ? (
        <div
          ref={strip}
          className="mt-2 flex items-center gap-2.5 rounded-xl bg-cream px-2.5 py-1.5"
          style={{ ["--lv" as string]: "0" } as React.CSSProperties}
        >
          <span className="flex h-6 shrink-0 items-center gap-[3px]" aria-hidden>
            {WEIGHTS.map((weight, index) => (
              <span
                key={index}
                className="h-6 w-[3px] rounded-full bg-lime-deep"
                style={{ transform: `scaleY(calc(0.1 + var(--lv, 0) * ${weight}))` }}
              />
            ))}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] leading-[1.4] text-muted">
            {interim || "Listening…"}
          </span>
          <button
            type="button"
            aria-label="Stop dictating"
            title="Stop dictating"
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggle}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#E5484D]/10 text-[#E5484D] transition hover:bg-[#E5484D]/20"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        </div>
      ) : error ? (
        <p className="mt-1.5 text-[10px] leading-[1.4] text-[#E5484D]">{error}</p>
      ) : null}
    </div>
  );
}

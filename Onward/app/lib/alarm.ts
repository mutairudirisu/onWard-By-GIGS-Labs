"use client";

import { useLocalState } from "./local-state";

/**
 * The sound a clock radio makes when an alarm lands, built from oscillators so the
 * app ships no audio file and it still plays with the network out. Browsers only
 * let a page make sound after a tap, which is why starting a block opens the audio
 * world early - see primeAlarm - instead of trying to open it at the finish, when
 * there is no tap to attach to.
 */

type AudioCtor = typeof AudioContext;

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** Call this from the tap that starts the timer. */
export function primeAlarm() {
  const ctx = audioContext();
  if (!ctx || ctx.state === "running") return;
  void ctx.resume().catch(() => {});
}

/** One tick: a struck metal note, fast attack, fast decay. */
function tick(ctx: AudioContext, at: number, freq: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.18, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
  gain.connect(ctx.destination);

  for (const [partial, mix] of [[1, 1], [2.76, 0.35]] as const) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * partial, at);
    const balance = ctx.createGain();
    balance.gain.setValueAtTime(mix, at);
    osc.connect(balance);
    balance.connect(gain);
    osc.start(at);
    osc.stop(at + 0.14);
  }
}

/** One held note: any waveform, one attack and one decay. */
function note(
  ctx: AudioContext,
  at: number,
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  peak = 0.16,
) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.connect(gain);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export type AlarmToneId = "classic" | "chime" | "bells" | "pulse" | "buzz";

export const ALARM_TONES: { id: AlarmToneId; label: string }[] = [
  { id: "classic", label: "Clock radio" },
  { id: "chime", label: "Door chime" },
  { id: "bells", label: "Morning bells" },
  { id: "pulse", label: "Soft pulse" },
  { id: "buzz", label: "Digital buzz" },
];

/** The ring the app shipped with: two struck ticks, four times over. */
function ringClassic(ctx: AudioContext, start: number) {
  for (let ring = 0; ring < 4; ring += 1) {
    const at = start + ring * 0.46;
    tick(ctx, at, 1046);
    tick(ctx, at + 0.18, 1318);
  }
}

/** Ding then dong, twice, the way a doorbell says someone is here. */
function ringChime(ctx: AudioContext, start: number) {
  for (let ring = 0; ring < 2; ring += 1) {
    const at = start + ring * 1.15;
    note(ctx, at, 659, 0.9, "sine", 0.18);
    note(ctx, at + 0.45, 523, 1.1, "sine", 0.18);
  }
}

/** Three rising notes, twice through. */
function ringBells(ctx: AudioContext, start: number) {
  for (let ring = 0; ring < 2; ring += 1) {
    const at = start + ring * 0.95;
    note(ctx, at, 1046, 0.3, "triangle", 0.14);
    note(ctx, at + 0.16, 1318, 0.3, "triangle", 0.14);
    note(ctx, at + 0.32, 1568, 0.5, "triangle", 0.14);
  }
}

/** Quiet double beeps with room between them. */
function ringPulse(ctx: AudioContext, start: number) {
  for (let pulse = 0; pulse < 3; pulse += 1) {
    const at = start + pulse * 0.7;
    note(ctx, at, 660, 0.22, "sine", 0.12);
    note(ctx, at + 0.26, 660, 0.22, "sine", 0.12);
  }
}

/** The flat burst of a digital alarm clock, kept low so it is not harsh. */
function ringBuzz(ctx: AudioContext, start: number) {
  for (let burst = 0; burst < 3; burst += 1) {
    const at = start + burst * 0.55;
    note(ctx, at, 880, 0.12, "square", 0.05);
    note(ctx, at + 0.16, 880, 0.12, "square", 0.05);
    note(ctx, at + 0.32, 880, 0.12, "square", 0.05);
  }
}

const RINGS: Record<AlarmToneId, (ctx: AudioContext, start: number) => void> = {
  classic: ringClassic,
  chime: ringChime,
  bells: ringBells,
  pulse: ringPulse,
  buzz: ringBuzz,
};

/** Play the alarm now in the chosen tone; an unknown id falls back to the ring
 *  the app shipped with. */
export function playAlarm(tone: AlarmToneId = "classic") {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state !== "running") void ctx.resume().catch(() => {});
  const start = ctx.currentTime + 0.05;
  (RINGS[tone] ?? ringClassic)(ctx, start);
}

/** The chosen tone, kept on this device under the account that picked it. Both
 *  home timers ring with the same one. */
export function useAlarmTone(userId: string | null) {
  return useLocalState<AlarmToneId>(
    userId ? `onward.alarm-tone.v1:${userId}` : null,
    "classic",
  );
}

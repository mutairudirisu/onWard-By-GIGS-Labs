"use client";

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

/** Play the alarm now: two ticks, four times over, just under two seconds. */
export function playAlarm() {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state !== "running") void ctx.resume().catch(() => {});
  const start = ctx.currentTime + 0.05;
  for (let ring = 0; ring < 4; ring += 1) {
    const at = start + ring * 0.46;
    tick(ctx, at, 1046);
    tick(ctx, at + 0.18, 1318);
  }
}

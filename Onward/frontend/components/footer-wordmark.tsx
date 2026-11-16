"use client";

import { useEffect, useRef } from "react";

const WORD = "onWard";

/**
 * Oversized footer wordmark. Letters ripple like water around the cursor and a
 * lime pool tracks it; everything settles back flat once the pointer leaves.
 */
export function FooterWordmark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Touch screens fire pointermove while scrolling, which would keep this
    // rAF loop repainting six gradient-clipped glyphs mid-flick. Mouse only.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    const centers: number[] = [];
    let fontSize = 160;
    let raf = 0;
    let last = 0;
    let amp = 0;
    let phase = 0;
    let px = 0;
    let active = false;

    const measure = () => {
      const base = wrap.getBoundingClientRect();
      letters.forEach((el, i) => {
        const box = el.getBoundingClientRect();
        centers[i] = box.left - base.left + box.width / 2;
      });
      if (letters[0]) fontSize = parseFloat(getComputedStyle(letters[0]).fontSize) || fontSize;
    };

    const frame = (now: number) => {
      const dt = Math.min(50, now - (last || now));
      last = now;
      amp += ((active ? 1 : 0) - amp) * Math.min(1, dt / 190);
      phase += dt * 0.0042;

      const reach = Math.max(180, wrap.clientWidth * 0.3);
      const swing = fontSize * 0.075;
      const waveLen = fontSize * 0.3;

      letters.forEach((el, i) => {
        const d = (centers[i] ?? 0) - px;
        const bell = Math.exp(-(d * d) / (2 * reach * reach));
        const w = Math.sin(d / waveLen - phase);
        const y = w * swing * bell * amp;
        const rot = Math.sin(d / waveLen - phase + 0.8) * 2.4 * bell * amp;
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      });

      if (amp > 0.003 || active) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        letters.forEach((el) => {
          el.style.transform = "";
        });
        if (poolRef.current) poolRef.current.style.opacity = "0";
      }
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      px = event.clientX - rect.left;
      active = true;
      wrap.style.setProperty("--mx", `${px}px`);
      if (poolRef.current) poolRef.current.style.opacity = "1";
      wake();
    };

    const onLeave = () => {
      active = false;
      wake();
    };

    measure();
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden className="relative mt-6 overflow-hidden lg:mt-10">
      <span
        ref={poolRef}
        className="pointer-events-none absolute bottom-0 left-[var(--mx,50%)] h-[70%] w-[46%] -translate-x-1/2 opacity-0 blur-[54px] transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 80%, rgba(201,242,78,0.34), rgba(201,242,78,0) 70%)",
        }}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-[radial-gradient(46%_120%_at_74%_116%,rgba(180,225,58,0.26),transparent_68%)] blur-[46px]" />
      <span className="relative block whitespace-nowrap font-brand text-[clamp(48px,22vw,700px)] font-bold leading-[0.95] tracking-[-0.045em]">
        <span className="relative left-1/2 inline-block -translate-x-1/2">
          {WORD.split("").map((ch, i) => {
            const accent = i === 0;
            return (
              <span
                key={`${ch}-${i}`}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className={`inline-block will-change-transform ${
                  accent ? "text-lime" : "bg-clip-text text-transparent"
                }`}
                style={
                  accent
                    ? undefined
                    : {
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.18))",
                        WebkitBackgroundClip: "text",
                      }
                }
              >
                {ch}
              </span>
            );
          })}
        </span>
      </span>
    </div>
  );
}

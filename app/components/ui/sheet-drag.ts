"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Where a sheet sits when it arrives, how tall it goes when dragged open, and below
 *  what fraction of the screen a release throws it away. All three read off the
 *  viewport the moment the sheet opens. */
const HALF = 0.58;
const FULL = 0.92;
const DISMISS = 0.4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/**
 * The grip every bottom sheet in the Exchange shares: pull it up for more room, push it
 * down past the threshold and it closes. Kept in one place so the thread, the share
 * drawer and the repost composer all answer the same drag the same way.
 */
export function useSheetDrag(open: boolean, onClose: () => void, initialHeight?: number) {
  const [viewport, setViewport] = useState(0);
  const [height, setHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ from: number; start: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const base = window.innerHeight;
    setViewport(base);
    setHeight(
      initialHeight === undefined
        ? Math.round(base * HALF)
        : Math.min(initialHeight, Math.max(240, base - 24)),
    );
    const onResize = () => {
      const nextViewport = window.innerHeight;
      setViewport(nextViewport);
      setHeight((current) => Math.min(current, Math.max(180, nextViewport - 24)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, initialHeight]);

  const release = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    const half = Math.round(viewport * HALF);
    const full = Math.round(viewport * FULL);
    setHeight((current) => {
      if (current < viewport * DISMISS) {
        onClose();
        return current;
      }
      return current > (half + full) / 2 ? full : half;
    });
  }, [onClose, viewport]);

  function gripProps() {
    return {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        drag.current = { from: event.clientY, start: height };
        setDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) return;
        event.preventDefault();
        setHeight(clamp(d.start + (d.from - event.clientY), 180, Math.max(240, viewport - 24)));
      },
      onPointerUp: release,
      onPointerCancel: release,
    };
  }

  return {
    gripProps,
    // The frame before the effect has measured anything still has to land at the
    // halfway mark, so a sheet never flashes at zero height.
    shellStyle: {
      height: height ? `${height}px` : initialHeight === undefined ? "58vh" : `${initialHeight}px`,
      maxHeight: initialHeight === undefined ? undefined : "calc(100dvh - 24px)",
      transition: dragging ? "none" : "height 0.22s ease-out",
      animation: "onward-sheet 0.22s ease-out",
    } as React.CSSProperties,
  };
}

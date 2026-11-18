"use client";

import { useEffect, useState } from "react";

/**
 * How much of the screen the on-screen keyboard has taken, in pixels, and 0 when
 * there is none. The gap between the window and the visible part of it is the whole
 * measurement, because the browsers give the keypad away differently: some shrink
 * only the visual viewport and leave the window alone, and a desktop does neither.
 * Anything that has to sit on top of the keyboard uses this instead of guessing at a
 * height - and a browser that shrinks the window itself reports 0 here, because such
 * a browser has already moved the sheet's bottom edge above the keypad.
 */
export function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!active) {
      setInset(0);
      return;
    }
    const viewport = window.visualViewport;
    const read = () => {
      const visible = viewport ? viewport.height : window.innerHeight;
      const offset = viewport ? viewport.offsetTop : 0;
      setInset(Math.max(0, Math.round(window.innerHeight - visible - offset)));
    };
    read();
    viewport?.addEventListener("resize", read);
    viewport?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    return () => {
      viewport?.removeEventListener("resize", read);
      viewport?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [active]);

  return inset;
}

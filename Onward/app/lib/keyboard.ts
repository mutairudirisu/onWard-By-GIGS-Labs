import { useEffect, useState } from "react";

/**
 * How much of the screen the on-screen keyboard is holding. Only the height is
 * read — the visual viewport's own scroll offset is not, because a bar lifted
 * by this much padding never has to chase a pan.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - viewport.height)));
    update();
    viewport.addEventListener("resize", update);
    return () => {
      viewport.removeEventListener("resize", update);
    };
  }, []);

  return inset;
}

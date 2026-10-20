import { useCallback, type RefObject } from "react";

const STEPS = 8;

// Secousse brève du conteneur ; strength en pixels, 0 pour ne rien faire.
export function useScreenShake(ref: RefObject<HTMLElement | null>) {
  return useCallback(
    (strength: number) => {
      const el = ref.current;
      if (!el || !strength) return;
      const frames = Array.from({ length: STEPS }, (_, i) => {
        const a = strength * (1 - i / STEPS);
        const dx = (Math.random() * 2 - 1) * a;
        const dy = (Math.random() * 2 - 1) * a;
        return { transform: `translate(${dx}px, ${dy}px)` };
      });
      el.animate([...frames, { transform: "translate(0, 0)" }], {
        duration: 420,
        easing: "ease-out",
      });
    },
    [ref],
  );
}

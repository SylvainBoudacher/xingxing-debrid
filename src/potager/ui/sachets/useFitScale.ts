import { useLayoutEffect, useRef, useState } from "react";

// Réduit `inner` pour qu'il tienne dans la hauteur de `outer`, sans jamais l'agrandir.
export function useFitScale() {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => setScale(Math.min(1, o.clientHeight / i.offsetHeight));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(o);
    observer.observe(i);
    return () => observer.disconnect();
  }, []);

  return { outer, inner, scale };
}

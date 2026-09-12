import { useCallback, useEffect, useRef, useState } from "react";

const FADE = 48;

// Fondu progressif aux extrémités d'un conteneur défilant horizontalement,
// affiché seulement du côté où il reste du contenu : la carte coupée s'estompe
// au lieu d'être tranchée, ce qui signale qu'on peut faire défiler.
export function useEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  const start = edges.left ? `transparent 0, black ${FADE}px` : "black 0";
  const end = edges.right ? `black calc(100% - ${FADE}px), transparent 100%` : "black 100%";
  const mask = `linear-gradient(to right, ${start}, ${end})`;

  return {
    ref,
    fadeStyle: { maskImage: mask, WebkitMaskImage: mask } as React.CSSProperties,
  };
}

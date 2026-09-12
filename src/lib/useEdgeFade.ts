import { useCallback, useEffect, useRef, useState } from "react";

const FADE = 48;

// Fondu progressif aux extrémités d'un conteneur défilant horizontalement,
// affiché seulement du côté où il reste du contenu : la carte coupée s'estompe
// au lieu d'être tranchée, ce qui signale qu'on peut faire défiler.
export function useEdgeFade<T extends HTMLElement>() {
  const [edges, setEdges] = useState({ left: false, right: false });
  const cleanup = useRef<(() => void) | null>(null);

  // Ref callback : le conteneur peut apparaître après le premier rendu (liste
  // chargée plus tard), un useEffect monté sur un ref vide ne s'attacherait jamais.
  const ref = useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;

    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };
    const resize = new ResizeObserver(measure);
    const observeChildren = () => {
      resize.disconnect();
      resize.observe(el);
      for (const child of Array.from(el.children)) resize.observe(child);
      measure();
    };
    const mutation = new MutationObserver(observeChildren);

    observeChildren();
    mutation.observe(el, { childList: true });
    el.addEventListener("scroll", measure, { passive: true });
    cleanup.current = () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  useEffect(() => () => cleanup.current?.(), []);

  const start = edges.left ? `transparent 0, black ${FADE}px` : "black 0";
  const end = edges.right ? `black calc(100% - ${FADE}px), transparent 100%` : "black 100%";
  const mask = `linear-gradient(to right, ${start}, ${end})`;

  return {
    ref,
    fadeStyle: { maskImage: mask, WebkitMaskImage: mask } as React.CSSProperties,
  };
}

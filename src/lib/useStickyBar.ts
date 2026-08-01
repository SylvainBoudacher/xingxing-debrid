import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Barre collante posée juste sous un en-tête lui-même collant.
 *
 * - `offset` : hauteur mesurée de l'en-tête (plus `gap`), à passer en `top` de
 *   la barre. Mesurée plutôt que codée en dur (padding responsive, zoom).
 * - `stuck` : vrai quand la barre a rejoint l'en-tête, pour ne donner le fond
 *   translucide qu'à ce moment-là.
 */
export function useStickyBar<H extends HTMLElement, B extends HTMLElement>(gap = 0) {
  const headerRef = useRef<H>(null);
  const barRef = useRef<B>(null);
  const [offset, setOffset] = useState(0);
  const [stuck, setStuck] = useState(false);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // Mesure immédiate : le ResizeObserver ne livre sa première entrée qu'au
    // prochain rendu, et jamais tant que la fenêtre est masquée.
    // offsetHeight plutôt que contentRect : la bordure de l'en-tête compte aussi.
    setOffset(header.offsetHeight + gap);
    const observer = new ResizeObserver(() => setOffset(header.offsetHeight + gap));
    observer.observe(header);
    return () => observer.disconnect();
  }, [gap]);

  useEffect(() => {
    const header = headerRef.current;
    const bar = barRef.current;
    if (!header || !bar) return;
    // Comparaison des positions réelles plutôt que du seuil en pixels : une
    // transformation sur un parent (animation d'entrée de page) décale les deux
    // éléments de la même façon et ne fausse donc pas le test.
    const check = () =>
      setStuck(bar.getBoundingClientRect().top <= header.getBoundingClientRect().bottom + gap + 1);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [offset, gap]);

  return { headerRef, barRef, offset, stuck };
}

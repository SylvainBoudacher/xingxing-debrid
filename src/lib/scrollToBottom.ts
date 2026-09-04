/** Conteneur qui defile reellement au-dessus de `el` (sinon la fenetre). */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const overflow = getComputedStyle(p).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

function toBottom(el: HTMLElement, behavior: ScrollBehavior) {
  const parent = scrollParent(el);
  if (parent) parent.scrollTo({ top: parent.scrollHeight, behavior });
  else window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
}

/**
 * Descend jusqu'en bas de la page qui contient `el`, et y reste tant que la
 * page grandit encore (images, genres charges apres coup) pendant `windowMs`.
 * Retourne la fonction d'annulation.
 */
export function scrollToBottom(el: HTMLElement, smooth: boolean, windowMs = 1200): () => void {
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
  toBottom(el, behavior);
  const observer = new ResizeObserver(() => toBottom(el, behavior));
  observer.observe(el);
  const timer = window.setTimeout(() => observer.disconnect(), windowMs);
  return () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

// Defilement anime d'un conteneur. scrollTo({ behavior: "smooth" }) n'est pas
// honore par tous les moteurs de webview, ce tween l'est partout.
export function smoothScrollTo(el: HTMLElement, top: number, duration = 400) {
  const start = el.scrollTop;
  const delta = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight)) - start;
  if (delta === 0) return;

  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.scrollTop = start + delta * ease;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

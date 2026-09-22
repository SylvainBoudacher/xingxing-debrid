export interface Size {
  w: number;
  h: number;
}

// décalage du centre de l'arbre par rapport au centre du cadre, et échelle
export interface View {
  dx: number;
  dy: number;
  k: number;
}

const RATIO = 1000 / 640;
const MIN_K = 0.6;
const MAX_K = 2;
// part de l'arbre qui reste toujours visible dans le cadre, en px
const KEEP = 80;

export const HOME: View = { dx: 0, dy: 0, k: 1 };

export const isHome = (v: View) => v.dx === 0 && v.dy === 0 && v.k === 1;

export function fitSize(viewport: Size, margin: number): Size {
  const w = Math.min(viewport.w, viewport.h * RATIO) * margin;
  return { w, h: w / RATIO };
}

export function zoomAt(v: View, p: { x: number; y: number }, factor: number, viewport: Size): View {
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
  const r = k / v.k;
  const cx = viewport.w / 2;
  const cy = viewport.h / 2;
  return {
    dx: p.x + (cx + v.dx - p.x) * r - cx,
    dy: p.y + (cy + v.dy - p.y) * r - cy,
    k,
  };
}

export function clampView(v: View, viewport: Size, tree: Size): View {
  const clamp = (d: number, half: number, side: number) => {
    const limit = side / 2 - KEEP + half;
    return Math.min(limit, Math.max(-limit, d));
  };
  return {
    dx: clamp(v.dx, (tree.w * v.k) / 2, viewport.w),
    dy: clamp(v.dy, (tree.h * v.k) / 2, viewport.h),
    k: v.k,
  };
}

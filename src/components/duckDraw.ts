// Shared canvas primitives used across the duck sprite, its patterns, and its
// accessories. Each takes the 2D context explicitly so callers stay stateless.

export function fillEll(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  style: string | CanvasGradient,
) {
  c.fillStyle = style;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

export function tri(c: CanvasRenderingContext2D, pts: [number, number][], style: string) {
  c.fillStyle = style;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fill();
}

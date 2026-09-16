// Contour d'une silhouette : chaque pixel vide touchant (diagonales comprises) un pixel plein.
export function outlineMask(solid: boolean[], w: number, h: number): boolean[] {
  const out = new Array<boolean>(solid.length).fill(false);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (solid[y * w + x]) continue;
      for (let dy = -1; dy <= 1 && !out[y * w + x]; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !solid[ny * w + nx]) continue;
          out[y * w + x] = true;
          break;
        }
    }
  return out;
}

const cache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

// Canvas blanc du contour d'un sprite, teinté ensuite par le matériau.
export function outlineCanvas(sprite: HTMLCanvasElement): HTMLCanvasElement {
  let cv = cache.get(sprite);
  if (cv) return cv;
  const { width: w, height: h } = sprite;
  const alpha = sprite.getContext("2d")!.getImageData(0, 0, w, h).data;
  const solid = Array.from({ length: w * h }, (_, i) => alpha[i * 4 + 3] > 0);
  const mask = outlineMask(solid, w, h);
  cv = Object.assign(document.createElement("canvas"), { width: w, height: h });
  const g = cv.getContext("2d")!;
  const img = g.createImageData(w, h);
  mask.forEach((on, i) => {
    if (on) img.data.set([255, 255, 255, 255], i * 4);
  });
  g.putImageData(img, 0, 0);
  cache.set(sprite, cv);
  return cv;
}

import * as THREE from "three";

export const PPU = 16;

// Park-Miller : un village identique à chaque lancement pour une même graine
export function createRng(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const pick = <T>(rng: () => number, a: readonly T[]): T => a[Math.floor(rng() * a.length)];
export const range = (rng: () => number, a: number, b: number) => a + rng() * (b - a);

export function dot(g: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

// Pixel transparent voisin d'un opaque : teinte sombre de ce voisin.
export function outlinePixels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  dark: [number, number, number] = [40, 26, 18],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 0) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = (ny * w + nx) * 4;
        if (data[j + 3] === 0) continue;
        out[i] = data[j] * 0.35 + dark[0] * 0.4;
        out[i + 1] = data[j + 1] * 0.3 + dark[1] * 0.4;
        out[i + 2] = data[j + 2] * 0.3 + dark[2] * 0.4;
        out[i + 3] = 255;
        break;
      }
    }
  return out;
}

export function outlineCanvas(g: CanvasRenderingContext2D, w: number, h: number) {
  const img = g.getImageData(0, 0, w, h);
  img.data.set(outlinePixels(img.data, w, h));
  g.putImageData(img, 0, 0);
}

export function canvasTex(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, rng: () => number) => void,
  opts: { repeat?: boolean; seed?: number; linear?: boolean } = {},
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext("2d")!;
  draw(g, createRng(opts.seed ?? c.width * 7919 + c.height));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = opts.linear ? THREE.LinearFilter : THREE.NearestFilter;
  t.generateMipmaps = false;
  if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

import * as THREE from "three";
import { pixelTexture } from "./texture";

export const makeCanvas = (w: number, h: number) =>
  Object.assign(document.createElement("canvas"), { width: w, height: h });

let cross: THREE.CanvasTexture | null = null;

// Étincelle en croix de 5 pixels, partagée par toutes les plantes.
export function crossTexture(): THREE.CanvasTexture {
  if (cross) return cross;
  const cv = makeCanvas(5, 5);
  const g = cv.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(2, 0, 1, 5);
  g.fillRect(0, 2, 5, 1);
  cross = pixelTexture(cv);
  return cross;
}

function smoothTexture(cv: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function radialTexture(rgb: string): THREE.CanvasTexture {
  const cv = makeCanvas(64, 64);
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return smoothTexture(cv);
}

export function raysTexture(): THREE.CanvasTexture {
  const cv = makeCanvas(96, 96);
  const g = cv.getContext("2d")!;
  g.translate(48, 48);
  g.fillStyle = "rgba(255,230,150,0.5)";
  for (let k = 0; k < 8; k++) {
    g.rotate(Math.PI / 4);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-4, -48);
    g.lineTo(4, -48);
    g.fill();
  }
  return smoothTexture(cv);
}

// Halo pixelisé autour de la silhouette du sprite, avec `pad` pixels de marge.
export function silhouetteGlow(
  source: HTMLCanvasElement,
  color: string,
  pad: number,
): THREE.CanvasTexture {
  const tint = makeCanvas(source.width, source.height);
  const tg = tint.getContext("2d")!;
  tg.drawImage(source, 0, 0);
  tg.globalCompositeOperation = "source-in";
  tg.fillStyle = color;
  tg.fillRect(0, 0, tint.width, tint.height);
  const out = makeCanvas(source.width + 2 * pad, source.height + 2 * pad);
  const g = out.getContext("2d")!;
  for (let dy = -pad; dy <= pad; dy++)
    for (let dx = -pad; dx <= pad; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > pad || d === 0) continue;
      g.globalAlpha = 0.35 * (1 - d / (pad + 1));
      g.drawImage(tint, pad + dx, pad + dy);
    }
  return pixelTexture(out);
}

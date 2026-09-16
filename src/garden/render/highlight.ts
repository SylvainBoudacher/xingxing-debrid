import * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { pixelTexture } from "./texture";
import { wx, wz } from "./world";

export const HIGHLIGHT_BOOST = 1.5;
export const pulse = (t: number): number => 0.65 + 0.35 * Math.sin(t * 5);

export type HighlightTone = "ok" | "no" | "info";

export const TONES: Record<HighlightTone, string> = {
  ok: "#9fd46e",
  no: "#e0a060",
  info: "#f3dca0",
};

export interface Highlight {
  set(key: TileKey | null, tone?: HighlightTone): void;
  update(t: number): void;
  dispose(): void;
}

// Cadre pixel posé au sol : coins en équerre et voile léger.
function frameCanvas(): HTMLCanvasElement {
  const cv = Object.assign(document.createElement("canvas"), { width: 48, height: 48 });
  const g = cv.getContext("2d")!;
  g.fillStyle = "rgba(255,255,255,0.14)";
  g.fillRect(3, 3, 42, 42);
  g.fillStyle = "#fff";
  for (const [x, y, dx, dy] of [
    [1, 1, 1, 1],
    [47, 1, -1, 1],
    [1, 47, 1, -1],
    [47, 47, -1, -1],
  ]) {
    g.fillRect(dx > 0 ? x : x - 12, dy > 0 ? y : y - 3, 12, 3);
    g.fillRect(dx > 0 ? x : x - 3, dy > 0 ? y : y - 12, 3, 12);
  }
  return cv;
}

export function createHighlight(scene: THREE.Scene): Highlight {
  const map = pixelTexture(frameCanvas());
  const material = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  scene.add(mesh);

  return {
    set(key, tone = "info") {
      mesh.visible = key !== null;
      if (!key) return;
      const [tx, ty] = parseTileKey(key);
      mesh.position.set(wx(tx), 0.015, wz(ty));
      material.color.set(TONES[tone]).multiplyScalar(HIGHLIGHT_BOOST);
    },
    update(t) {
      material.opacity = pulse(t);
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}

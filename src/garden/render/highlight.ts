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
  set(keys: TileKey[], tone?: HighlightTone): void;
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
  const geometry = new THREE.PlaneGeometry(1, 1);
  // un cadre par case surlignée, créés à la demande et réutilisés
  const meshes: THREE.Mesh[] = [];

  function meshAt(i: number): THREE.Mesh {
    if (!meshes[i]) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);
      meshes[i] = mesh;
    }
    return meshes[i];
  }

  return {
    set(keys, tone = "info") {
      keys.forEach((key, i) => {
        const [tx, ty] = parseTileKey(key);
        const mesh = meshAt(i);
        mesh.position.set(wx(tx), 0.015, wz(ty));
        mesh.visible = true;
      });
      for (let i = keys.length; i < meshes.length; i++) meshes[i].visible = false;
      material.color.set(TONES[tone]).multiplyScalar(HIGHLIGHT_BOOST);
    },
    update(t) {
      material.opacity = pulse(t);
    },
    dispose() {
      for (const mesh of meshes) scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}

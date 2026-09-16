import * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { spriteCanvas } from "../sprites/sprite";
import { disposeMesh, makeBillboard } from "./billboards";
import { HIGHLIGHT_BOOST, pulse } from "./highlight";
import { outlineCanvas } from "./outline";
import { pixelTexture } from "./texture";
import { wx, wz } from "./world";

interface Crow {
  mesh: THREE.Mesh;
  outline: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  key: TileKey;
  born: number;
  flying: number | null;
}

export interface Crows {
  add(id: string, key: TileKey, t: number): void;
  fly(id: string, t: number): TileKey | null;
  perched(): { id: string; mesh: THREE.Mesh }[];
  // contour du corbeau survolé, null pour n'en montrer aucun
  outline(id: string | null, color?: string): void;
  update(t: number): void;
  dispose(): void;
}

const FLIGHT_S = 1.6;
const W = 0.8;
const H = 1.2;

export function createCrows(scene: THREE.Scene): Crows {
  const crows = new Map<string, Crow>();
  const sprite = spriteCanvas({ name: "corbeau" });
  const outlineMap = pixelTexture(outlineCanvas(sprite));

  function remove(id: string) {
    const c = crows.get(id);
    if (!c) return;
    scene.remove(c.mesh);
    disposeMesh(c.mesh);
    crows.delete(id);
  }

  return {
    add(id, key, t) {
      if (crows.has(id)) return;
      const [tx, ty] = parseTileKey(key);
      const mesh = makeBillboard(sprite, W, H);
      mesh.position.set(wx(tx) + 0.28, 0, wz(ty) + 0.45);
      const geo = new THREE.PlaneGeometry(W, H);
      geo.translate(0, H / 2, 0);
      const outline = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map: outlineMap,
          transparent: true,
          alphaTest: 0.5,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
      );
      outline.position.z = 0.005;
      outline.visible = false;
      mesh.add(outline);
      scene.add(mesh);
      crows.set(id, { mesh, outline, key, born: t, flying: null });
    },
    // renvoie la case quittée (pour les plumes), null si le corbeau n'est plus là
    fly(id, t) {
      const c = crows.get(id);
      if (!c || c.flying !== null) return null;
      c.flying = t;
      c.outline.visible = false;
      return c.key;
    },
    perched: () =>
      [...crows.entries()]
        .filter(([, c]) => c.flying === null)
        .map(([id, c]) => ({ id, mesh: c.mesh })),
    outline(id, color) {
      for (const [cid, c] of crows) {
        c.outline.visible = cid === id && c.flying === null;
        if (c.outline.visible && color)
          c.outline.material.color.set(color).multiplyScalar(HIGHLIGHT_BOOST);
      }
    },
    update(t) {
      for (const [id, c] of crows) {
        c.outline.material.opacity = pulse(t);
        const [tx, ty] = parseTileKey(c.key);
        if (c.flying === null) {
          c.mesh.position.y = Math.max(0, Math.sin(t * 7 + c.born) * 0.05);
          c.mesh.rotation.z = Math.sin(t * 2.3 + c.born) > 0.7 ? 0.25 : 0;
          continue;
        }
        const a = t - c.flying;
        c.mesh.position.set(
          wx(tx) + 0.28 + a * a * 4,
          a * 2.6 + a * a * 2,
          wz(ty) + 0.45 - a * 1.5,
        );
        c.mesh.rotation.z = -0.4 * Math.min(1, a * 3);
        if (a > FLIGHT_S) remove(id);
      }
    },
    dispose() {
      for (const id of [...crows.keys()]) remove(id);
      outlineMap.dispose();
    },
  };
}

import * as THREE from "three";
import { groundHeight } from "../core/catalog/map";
import { parcelCells } from "../core/cells";
import { stageOf } from "../core/growth";
import type { PotagerSave } from "../core/types";
import { hasWeed } from "../core/nuisances";
import { flowerTex, rarityMarkTex, stageTex } from "../textures/flowers";
import { crowTex, weedTex } from "../textures/pests";
import { buildForest } from "./forestView";
import { tuftTex } from "../textures/nature";
import { canvasTex, dot } from "../textures/pixel";
import { wetTex } from "../textures/terrain";
import { spriteMesh } from "./sprite";

// dessus de la terre des parcelles (village.ts : boîte de 0,16)
const SOIL_TOP = 0.165;

let shared: {
  grass: THREE.Texture;
  tuft: THREE.Texture;
  furrows: THREE.Texture;
  wet: THREE.Texture;
} | null = null;
function textures() {
  return (shared ??= {
    grass: canvasTex(16, 16, (g, rng) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++)
          dot(g, x, y, rng() < 0.3 ? "#4e7a2c" : rng() < 0.5 ? "#5e8a34" : "#6a9a3a");
    }),
    tuft: tuftTex(false),
    furrows: canvasTex(16, 16, (g) => {
      for (let y = 0; y < 16; y++) dot(g, 0, y, y % 4 < 2 ? "#3e2412" : "#5a3820", 16, 1);
    }),
    wet: wetTex(),
  });
}

function flat(
  tex: THREE.Texture,
  cx: number,
  cz: number,
  size: number,
  y: number,
  extra: THREE.MeshLambertMaterialParameters = {},
) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.3, ...extra }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(cx, y, cz);
  m.receiveShadow = true;
  return m;
}

export interface GardenView {
  group: THREE.Group;
  // fleur de chaque case épanouie, pour l'animation d'éclosion
  flowers: Map<string, THREE.Mesh>;
  // corneilles, animées par la scène
  crows: THREE.Mesh[];
  // objets de forêt, cliquables
  forest: THREE.Mesh[];
}

export function buildGarden(save: PotagerSave): GardenView {
  const t = textures();
  const group = new THREE.Group();
  const flowers = new Map<string, THREE.Mesh>();
  const crows: THREE.Mesh[] = [];
  for (const parcel of save.parcels)
    for (const slot of parcelCells(parcel)) {
      const c = save.cells[slot.key];
      if (!c) continue;
      const { x, z } = slot.center;
      const y = groundHeight(x, z) + SOIL_TOP;
      if (hasWeed(save, slot.key)) {
        const weed = spriteMesh(weedTex(), 0.6, 0.4);
        weed.position.set(x - 0.22, y, z - 0.2);
        group.add(weed);
      }
      if (save.crows[slot.key]) {
        const crow = spriteMesh(crowTex(0), 0.7, 0.58);
        crow.position.set(x + 0.15, y, z + 0.15);
        group.add(crow);
        crows.push(crow);
      }
      if (c.kind === "herbe") {
        group.add(flat(t.grass, x, z, 0.94, y, { alphaTest: 0 }));
        for (const [dx, dz] of [
          [-0.25, -0.2],
          [0.2, 0.05],
          [-0.05, 0.28],
        ]) {
          const tuft = spriteMesh(t.tuft, 0.45, 0.45, false);
          tuft.position.set(x + dx, y, z + dz);
          group.add(tuft);
        }
        continue;
      }
      group.add(
        flat(
          t.furrows,
          x,
          z,
          0.9,
          y + 0.002,
          c.kind === "bechee" && c.loose ? { color: "#c8a888" } : {},
        ),
      );
      if (c.kind !== "plante") continue;
      if (save.playTimeMs < c.wetUntil)
        group.add(flat(t.wet, x, z, 0.95, y + 0.004, { opacity: 0.75 }));
      const stage = stageOf(c.progress);
      const plant = spriteMesh(
        stage === 4 ? flowerTex(c.seed.species, c.seed.color) : stageTex(stage),
        0.9,
        1.35,
      );
      plant.position.set(x, y, z);
      group.add(plant);
      if (stage === 4) flowers.set(slot.key, plant);
      else {
        const mark = spriteMesh(rarityMarkTex(c.seed.rarity), 0.24, 0.36, false);
        mark.position.set(x - 0.32, y, z + 0.34);
        group.add(mark);
      }
    }
  const forest = buildForest(save);
  forest.forEach((m) => group.add(m));
  return { group, flowers, crows, forest };
}

// les textures sont en cache et partagées : seules géométries et matériaux sont libérés
export function disposeGarden(view: GardenView) {
  view.group.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
}

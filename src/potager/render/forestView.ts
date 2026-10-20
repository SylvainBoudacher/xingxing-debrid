import type * as THREE from "three";
import { groundHeight, MAP } from "../core/catalog/map";
import type { PotagerSave } from "../core/types";
import { acornTex, mushroomTex } from "../textures/pests";
import { spriteMesh } from "./sprite";

// Champignons et glands posés sous les arbres ; cliquables.
export function buildForest(save: PotagerSave): THREE.Mesh[] {
  return Object.entries(save.forest).map(([i, kind]) => {
    const p = MAP.forest[Number(i)];
    const m = spriteMesh(kind === "gland" ? acornTex() : mushroomTex(), 0.45, 0.45);
    m.position.set(p.x, groundHeight(p.x, p.z), p.z);
    return m;
  });
}

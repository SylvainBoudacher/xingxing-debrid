import { MAP } from "../catalog/map";
import { rarityOf } from "../catalog/species";
import { RARITIES } from "../catalog/rarity";
import { serve } from "../economy/clients";
import type { Demand, FlowerStack, Point, PotagerSave } from "../types";
import type { Trade } from "./tasks";

const etal = MAP.buildings.find((b) => b.id === "etal")!;
// devant l'étal, à droite de l'endroit où se tient l'avatar
export const FLORIST_SPOT: Point = { x: etal.x + 1.4, z: etal.z + etal.d / 2 + 0.6 };

const bonus = (f: FlowerStack, d: Demand) =>
  (f.species === d.species ? 1 : 0) + (f.color === d.color ? 1 : 0);
const rank = (f: FlowerStack) => RARITIES.indexOf(rarityOf(f.species, f.color) ?? "legendaire");

// la pile qui touche le plus de bonus ; sinon la moins rare, l'ordinaire avant la belle
export function pickStallFlower(stall: FlowerStack[], demand: Demand): number {
  let best = 0;
  for (let i = 1; i < stall.length; i++) {
    const a = stall[i],
      b = stall[best];
    const d =
      bonus(b, demand) - bonus(a, demand) ||
      rank(a) - rank(b) ||
      (a.quality === "ordinaire" ? 0 : 1) - (b.quality === "ordinaire" ? 0 : 1);
    if (d < 0) best = i;
  }
  return best;
}

const canServe = (save: PotagerSave) =>
  !!save.staff.fleuriste?.active && !!save.client && save.stall.length > 0;

// Sert les clients avec la réserve de l'étal, sauf en pause.
export const FLEURISTE: Trade = {
  plan(save) {
    if (!save.staff.fleuriste?.active) return { kind: "pause" };
    return canServe(save) ? { gesture: "servir", stand: FLORIST_SPOT } : { kind: "etal" };
  },
  check: (save) => canServe(save),
  act(save, _id, w, _task, grade, rng) {
    const r = serve(save, pickStallFlower(save.stall, save.client!.demand), grade, rng);
    return r && { save: r.save, worker: w };
  },
};

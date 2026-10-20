import { stageOf } from "../core/growth";
import { hasWeed } from "../core/nuisances";
import type { Cell, PotagerSave } from "../core/types";

// Ce qui se voit d'une case ; l'espèce n'y entre qu'à l'éclosion.
export function cellLook(c: Cell, playTimeMs: number): string {
  if (c.kind === "herbe") return "h";
  if (c.kind === "bechee") return c.loose ? "B" : "b";
  const stage = stageOf(c.progress);
  const wet = playTimeMs < c.wetUntil ? "w" : "";
  return stage === 4
    ? `f${wet}:${c.seed.species}:${c.seed.color}`
    : `p${stage}${wet}:${c.seed.rarity}`;
}

export const gardenKey = (save: PotagerSave) =>
  Object.entries(save.cells)
    .map(([k, c]) => {
      const weed = hasWeed(save, k) ? "+w" : "";
      const crow = save.crows[k] ? "+c" : "";
      return `${k}=${cellLook(c, save.playTimeMs)}${weed}${crow}`;
    })
    .join("|") +
  `|f=${Object.entries(save.forest)
    .map(([i, kind]) => `${i}${kind[0]}`)
    .join(",")}`;

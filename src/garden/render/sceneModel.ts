import { isSpeciesId } from "../core/catalog/species";
import { growthOf } from "../core/growth";
import { soilTiles } from "../core/plots";
import type { GardenSave, Rarity, TileContent, TileKey, VariantId } from "../core/types";
import { isRaining, rainIntervals, type RainSource } from "../core/weather";
import { spriteKey, type SpriteRef } from "../sprites/sprite";

export interface SceneItem {
  ref: SpriteRef;
  rarity: Rarity | null;
  variant: VariantId | null;
  sway: boolean;
  thirsty: boolean;
}

export interface SceneModel {
  items: Map<TileKey, SceneItem>;
  soil: TileKey[];
  wet: Set<TileKey>;
  dry: Set<TileKey>;
  raining: boolean;
}

const STAGE_REFS: SpriteRef[] = [
  { name: "graine", color: "cream" },
  { name: "pousse" },
  { name: "jeune" },
  { name: "bouton" },
];

export const itemKey = (item: SceneItem): string =>
  `${spriteKey(item.ref)}:${item.rarity ?? ""}:${item.thirsty ? 1 : 0}`;

function itemOf(
  tile: TileContent,
  now: number,
  rain: RainSource,
  marks: { wet: Set<TileKey>; dry: Set<TileKey> },
  key: TileKey,
): SceneItem {
  const still = { rarity: null, variant: null, sway: false, thirsty: false };
  switch (tile.kind) {
    case "plant": {
      const g = growthOf(tile, now, rain);
      if (g.wet) marks.wet.add(key);
      if (g.stage < 4) {
        const thirsty = !g.wet;
        if (thirsty) marks.dry.add(key);
        return { ...still, ref: STAGE_REFS[g.stage], sway: g.stage > 0, thirsty };
      }
      const { species, color, rarity, variant } = tile.seed;
      if (!isSpeciesId(species)) return { ...still, ref: STAGE_REFS[0] };
      return {
        ref: { name: species, color, ...(variant && { variant }) },
        rarity,
        variant: variant ?? null,
        sway: true,
        thirsty: false,
      };
    }
    case "hole":
      return { ref: { name: "trou" }, ...still };
    case "leaves":
      return { ref: { name: "tas" }, ...still };
    case "decor":
      return { ref: { name: tile.id }, ...still };
  }
}

export function buildSceneModel(
  save: GardenSave,
  now: number,
  rain: RainSource = rainIntervals,
): SceneModel {
  const items = new Map<TileKey, SceneItem>();
  const marks = { wet: new Set<TileKey>(), dry: new Set<TileKey>() };
  for (const [key, tile] of Object.entries(save.tiles) as [TileKey, TileContent | undefined][]) {
    if (tile) items.set(key, itemOf(tile, now, rain, marks, key));
  }
  const raining =
    rain === rainIntervals
      ? isRaining(now)
      : rain(now - 1, now + 1).some((r) => now >= r.start && now < r.end);
  return { items, soil: soilTiles(save.plots), wet: marks.wet, dry: marks.dry, raining };
}

export function diffItems(prev: Map<TileKey, SceneItem>, next: Map<TileKey, SceneItem>) {
  const remove: TileKey[] = [];
  const add: TileKey[] = [];
  for (const [key, item] of prev) {
    const n = next.get(key);
    if (!n || itemKey(n) !== itemKey(item)) remove.push(key);
  }
  for (const [key, item] of next) {
    const p = prev.get(key);
    if (!p || itemKey(p) !== itemKey(item)) add.push(key);
  }
  return { remove, add };
}

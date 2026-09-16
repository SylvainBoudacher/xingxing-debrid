import { growthOf } from "../core/growth";
import { soilTiles } from "../core/plots";
import type { GardenSave, TileContent, TileKey } from "../core/types";
import { isRaining, rainIntervals, type RainSource } from "../core/weather";
import { spriteKey, type SpriteRef } from "../sprites/sprite";

export interface SceneItem {
  ref: SpriteRef;
  legendary: boolean;
  sway: boolean;
}

export interface SceneModel {
  items: Map<TileKey, SceneItem>;
  soil: TileKey[];
  wet: Set<TileKey>;
  raining: boolean;
}

const STAGE_REFS: SpriteRef[] = [
  { name: "graine", color: "cream" },
  { name: "pousse" },
  { name: "jeune" },
  { name: "bouton" },
];

export const itemKey = (item: SceneItem): string =>
  `${spriteKey(item.ref)}:${item.legendary ? 1 : 0}`;

function itemOf(
  tile: TileContent,
  now: number,
  rain: RainSource,
  wet: Set<TileKey>,
  key: TileKey,
): SceneItem {
  switch (tile.kind) {
    case "plant": {
      const g = growthOf(tile, now, rain);
      if (g.wet) wet.add(key);
      if (g.stage < 4) return { ref: STAGE_REFS[g.stage], legendary: false, sway: g.stage > 0 };
      const { species, color, rarity } = tile.seed;
      return { ref: { name: species, color }, legendary: rarity === "legendaire", sway: true };
    }
    case "hole":
      return { ref: { name: "trou" }, legendary: false, sway: false };
    case "leaves":
      return { ref: { name: "tas" }, legendary: false, sway: false };
    case "decor":
      return { ref: { name: tile.id }, legendary: false, sway: false };
  }
}

export function buildSceneModel(
  save: GardenSave,
  now: number,
  rain: RainSource = rainIntervals,
): SceneModel {
  const items = new Map<TileKey, SceneItem>();
  const wet = new Set<TileKey>();
  for (const [key, tile] of Object.entries(save.tiles) as [TileKey, TileContent | undefined][]) {
    if (tile) items.set(key, itemOf(tile, now, rain, wet, key));
  }
  const raining =
    rain === rainIntervals
      ? isRaining(now)
      : rain(now - 1, now + 1).some((r) => now >= r.start && now < r.end);
  return { items, soil: soilTiles(save.plots), wet, raining };
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

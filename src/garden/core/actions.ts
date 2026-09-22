import type { RecipeId } from "./catalog/recipes";
import { bump } from "./counters";
import { growthOf, WATER_MS } from "./growth";
import { DECOR_LE, flowerName, pickedWord } from "./labels";
import { fieldRect, isInField, isSoil } from "./plots";
import { planPotion } from "./potions";
import { rollPickSeed, type Rng } from "./rolls";
import { harvestTool } from "./catalog/species";
import { setTile } from "./tiles";
import { mergeIntervals } from "./time";
import {
  parseTileKey,
  type DecorId,
  type Flower,
  type GardenSave,
  type PlantTile,
  type Rarity,
  type Seed,
  type TileKey,
} from "./types";
import { rainIntervals, type RainSource } from "./weather";

export type Tool =
  "main" | "creuser" | "semer" | "arroser" | "secateur" | "rateau" | "decor" | "preparer";
export const TOOLS: Tool[] = [
  "main",
  "creuser",
  "semer",
  "arroser",
  "secateur",
  "rateau",
  "decor",
  "preparer",
];

export type Target = { kind: "tile"; key: TileKey } | { kind: "crow"; id: string };
export type Particle = "dirt" | "water" | "leaves" | "petals" | "feathers" | "sparkles";
export type Effect =
  | { kind: "burst"; key: TileKey; particle: Particle }
  | { kind: "chase"; id: string }
  | { kind: "toast"; text: string };

export interface Outcome {
  save: GardenSave;
  effects: Effect[];
}

export type Plan =
  { ok: true; label: string; apply: () => Outcome } | { ok: false; label: string; reason: string };

const no = (label: string, reason: string): Plan => ({ ok: false, label, reason });
const yes = (label: string, apply: () => Outcome): Plan => ({ ok: true, label, apply });
const burst = (key: TileKey, particle: Particle): Effect => ({ kind: "burst", key, particle });

export interface PlanOptions {
  rng?: Rng;
  rain?: RainSource;
  seedRarity?: Rarity | null;
  decor?: DecorId | null;
  potion?: RecipeId | null;
}

// L'arbre est haut et large : il masquerait le champ s'il était planté au milieu.
function onBorder(plots: GardenSave["plots"], key: TileKey): boolean {
  const f = fieldRect(plots);
  const [x, y] = parseTileKey(key);
  return x === f.x || y === f.y || x === f.x + f.w - 1 || y === f.y + f.h - 1;
}

// La plus ancienne graine de la rareté demandée, sinon la plus ancienne tout court.
export function nextSeedIndex(seeds: Seed[], rarity: Rarity | null | undefined): number {
  if (rarity) {
    const i = seeds.findIndex((s) => s.rarity === rarity);
    if (i >= 0) return i;
  }
  return seeds.length ? 0 : -1;
}

// Même fonction pour l'infobulle (avant le clic) et pour l'effet (au clic).
export function planAction(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
  opts: PlanOptions = {},
): Plan | null {
  const {
    rng = Math.random,
    rain = rainIntervals,
    seedRarity = null,
    decor = null,
    potion = null,
  } = opts;
  if (target.kind === "crow")
    return yes("Chasser", () => ({
      save: bump(save, "crowsChased"),
      effects: [{ kind: "chase", id: target.id }],
    }));

  const { key } = target;
  if (!isInField(save.plots, key)) return null;
  const tile = save.tiles[key];
  const soil = isSoil(save.plots, key);

  switch (tool) {
    case "creuser":
      if (!soil) return no("Creuser", "seulement dans la terre");
      if (tile) return no("Creuser", "la case est occupée");
      return yes("Creuser un trou", () => ({
        save: bump(setTile(save, key, { kind: "hole", dugAt: now }), "dug"),
        effects: [burst(key, "dirt")],
      }));

    case "semer": {
      if (tile?.kind !== "hole")
        return no("Semer", soil && !tile ? "creuse d'abord un trou" : "il faut un trou");
      const index = nextSeedIndex(save.inventory.seeds, seedRarity);
      if (index < 0) return no("Semer", "plus de graines");
      const seed = save.inventory.seeds[index];
      return yes("Semer une graine", () => {
        const rest = save.inventory.seeds.filter((_, i) => i !== index);
        const next = { ...save, inventory: { ...save.inventory, seeds: rest } };
        const planted = setTile(next, key, { kind: "plant", seed, sownAt: now, watered: [] });
        return { save: bump(planted, "sown"), effects: [burst(key, "dirt")] };
      });
    }

    case "arroser":
      if (tile?.kind !== "plant") return no("Arroser", "rien à arroser, sème d'abord");
      return yes("Arroser", () => {
        const watered = mergeIntervals([...tile.watered, { start: now, end: now + WATER_MS }]);
        return {
          save: bump(setTile(save, key, { ...tile, watered }), "watered"),
          effects: [burst(key, "water")],
        };
      });

    case "rateau":
      if (tile?.kind !== "leaves") return no("Ratisser", "pas de feuilles ici");
      return yes("Ratisser", () => ({
        save: bump(setTile(save, key, undefined), "raked"),
        effects: [burst(key, "leaves")],
      }));

    case "decor": {
      if (!decor) return no("Décor", "choisis un décor dans le panneau");
      if ((save.inventory.decor[decor] ?? 0) <= 0) return no("Décor", "il ne t'en reste plus");
      if (tile) return no("Décor", "il y a déjà quelque chose ici");
      if (soil) return no("Décor", "pas sur la terre d'une parcelle");
      if (decor === "arbre" && !onBorder(save.plots, key))
        return no("Décor", "un arbre ne se plante qu'en bordure du champ");
      return yes(`Poser ${DECOR_LE[decor]}`, () => {
        const left = { ...save.inventory.decor, [decor]: save.inventory.decor[decor] - 1 };
        const next = { ...save, inventory: { ...save.inventory, decor: left } };
        return { save: setTile(next, key, { kind: "decor", id: decor }), effects: [] };
      });
    }

    case "preparer":
      return planPotion(save, key, potion, now, rng, rain);

    case "main":
    case "secateur": {
      const cut = tool === "secateur";
      if (!cut && tile?.kind === "decor")
        return yes(`Ranger ${DECOR_LE[tile.id]}`, () => {
          const decors = save.inventory.decor;
          const next = {
            ...save,
            inventory: {
              ...save.inventory,
              decor: { ...decors, [tile.id]: (decors[tile.id] ?? 0) + 1 },
            },
          };
          return { save: setTile(next, key, undefined), effects: [] };
        });
      if (tile?.kind === "leaves")
        return cut ? no("Couper", "rien à couper ici") : no("Ramasser", "prends le râteau");
      const g = tile?.kind === "plant" ? growthOf(tile, now, rain) : null;
      if (tile?.kind !== "plant" || !g || g.stage < 4)
        return cut ? no("Couper", "rien à couper ici") : null;
      const needed = harvestTool(tile.seed.species);
      const pick = () => pickFlower(save, key, tile, g.beautiful, rng);
      if (cut)
        return needed === "secateur"
          ? yes("Couper au sécateur", pick)
          : no("Couper", "tige fragile, cueille-la à la main");
      return needed === "main"
        ? yes("Cueillir à la main", pick)
        : no("Cueillir", "tige trop épaisse, prends le sécateur");
    }
  }
}

function pickFlower(
  save: GardenSave,
  key: TileKey,
  plant: PlantTile,
  beautiful: boolean,
  rng: Rng,
): Outcome {
  const { species, color, rarity, variant } = plant.seed;
  const flower: Flower = { species, color, rarity, ...(variant && { variant }) };
  const seed = rollPickSeed(flower, beautiful, rng);
  const cleared = setTile(save, key, undefined);
  const next: GardenSave = {
    ...cleared,
    inventory: {
      ...cleared.inventory,
      basket: [...cleared.inventory.basket, flower],
      seeds: seed ? [...cleared.inventory.seeds, seed] : cleared.inventory.seeds,
    },
  };
  const text = `${flowerName(flower)} ${pickedWord(species)}${seed ? " : +1 graine" : ""}`;
  const counted = beautiful ? bump(bump(next, "picked"), "pickedBeautiful") : bump(next, "picked");
  return {
    save: counted,
    effects: [burst(key, "petals"), { kind: "toast", text }],
  };
}

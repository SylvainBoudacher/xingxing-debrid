import type { Effect, Outcome, Particle, Plan } from "./actions";
import { recipeById, type RecipeId } from "./catalog/recipes";
import { speciesOf } from "./catalog/species";
import { bump, bumpBy } from "./counters";
import { growthOf, WATER_MS } from "./growth";
import { flowerName } from "./labels";
import { isInField } from "./plots";
import type { Rng } from "./rolls";
import { setTile } from "./tiles";
import { mergeIntervals } from "./time";
import {
  parseTileKey,
  tileKey,
  type GardenSave,
  type PlantTile,
  type PlotId,
  type TileKey,
  type VariantId,
} from "./types";
import type { RainSource } from "./weather";

export const POWDER_CHANCE = 0.5;

const POWDER: Record<"givre" | "or" | "lune", VariantId> = {
  givre: "givree",
  or: "doree",
  lune: "lumineuse",
};

const no = (label: string, reason: string): Plan => ({ ok: false, label, reason });
const burst = (key: TileKey, particle: Particle): Effect => ({ kind: "burst", key, particle });

// Le carré 3 x 3 centré sur la case, limité au champ.
export function roseeArea(plots: PlotId[], key: TileKey): TileKey[] {
  const [x, y] = parseTileKey(key);
  const out: TileKey[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const k = tileKey(x + dx, y + dy);
      if (isInField(plots, k)) out.push(k);
    }
  return out;
}

function spendDose(save: GardenSave, potion: RecipeId): GardenSave {
  const potions = save.inventory.potions;
  const left = { ...potions, [potion]: (potions[potion] ?? 0) - 1 };
  return bump({ ...save, inventory: { ...save.inventory, potions: left } }, "potionsUsed");
}

// L'effet est écrit tout de suite sur la case ; il reste caché jusqu'à l'éclosion,
// sauf pour la clairvoyance et la teinture qui révèlent.
export function planPotion(
  save: GardenSave,
  key: TileKey,
  potion: RecipeId | null,
  now: number,
  rng: Rng,
  rain: RainSource,
): Plan {
  if (!potion) return no("Préparer", "choisis une préparation dans le panneau");
  const { name } = recipeById(potion);
  if ((save.inventory.potions[potion] ?? 0) <= 0) return no(name, "il ne t'en reste plus");
  const yes = (apply: () => Outcome): Plan => ({ ok: true, label: name, apply });

  if (potion === "rosee") {
    const plants = roseeArea(save.plots, key).filter((k) => save.tiles[k]?.kind === "plant");
    if (!plants.length) return no(name, "aucune plante autour");
    return yes(() => {
      let next = save;
      for (const k of plants) {
        const p = next.tiles[k] as PlantTile;
        const watered = mergeIntervals([...p.watered, { start: now, end: now + WATER_MS }]);
        next = setTile(next, k, { ...p, watered });
      }
      return {
        save: spendDose(bumpBy(next, "watered", plants.length), potion),
        effects: plants.map((k) => burst(k, "water")),
      };
    });
  }

  const tile = save.tiles[key];
  if (tile?.kind !== "plant") return no(name, "rien à faire pousser ici");
  if (growthOf(tile, now, rain).stage >= 4) return no(name, "déjà éclose");
  const done = (plant: PlantTile, text: string): Outcome => ({
    save: spendDose(setTile(save, key, plant), potion),
    effects: [burst(key, "sparkles"), { kind: "toast", text }],
  });

  switch (potion) {
    case "croissance":
      return yes(() =>
        done({ ...tile, boosts: [...(tile.boosts ?? []), now] }, "La plante a grandi d'une étape"),
      );
    case "clairvoyance":
      if (tile.revealed) return no(name, "déjà révélée");
      return yes(() => done({ ...tile, revealed: true }, `Révélée : ${flowerName(tile.seed)}`));
    case "teinture": {
      const others = speciesOf(tile.seed.species).colors.filter(
        (c) => c.rarity === tile.seed.rarity && c.color !== tile.seed.color,
      );
      if (!others.length) return no(name, "aucune autre couleur de cette rareté");
      return yes(() => {
        const { color } = others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
        const seed = { ...tile.seed, color };
        return done({ ...tile, seed, revealed: true }, `Nouvelle couleur : ${flowerName(seed)}`);
      });
    }
    default: {
      const variant = POWDER[potion];
      return yes(() => {
        const seed = rng() < POWDER_CHANCE ? { ...tile.seed, variant } : tile.seed;
        return done({ ...tile, seed }, "Poudre répandue, surprise à l'éclosion");
      });
    }
  }
}

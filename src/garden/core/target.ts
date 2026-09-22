import { nextSeedIndex } from "./actions";
import { GROWTH_MS, growthOf, WET_BONUS, wetIntervals } from "./growth";
import { DECOR_FR, flowerName, formatDuration, RARITY_FR, STAGE_FR } from "./labels";
import { isSoil } from "./plots";
import { harvestTool } from "./catalog/species";
import type { GardenSave, PlantTile, Rarity, TileKey } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export type TileKind = "grass" | "soil" | "hole" | "plant" | "decor" | "leaves" | "crow";

export interface TileInfo {
  kind: TileKind;
  title: string;
  lines: string[];
  progress?: number;
}

const RATE = 1 + WET_BONUS;

export interface DescribeOptions {
  rain?: RainSource;
  seedRarity?: Rarity | null;
}

export function describeTile(
  save: GardenSave,
  key: TileKey,
  now: number,
  opts: DescribeOptions = {},
): TileInfo {
  const { rain = rainIntervals, seedRarity = null } = opts;
  const tile = save.tiles[key];
  if (!tile)
    return isSoil(save.plots, key)
      ? { kind: "soil", title: "Terre", lines: ["Libre : creuse un trou pour semer"] }
      : { kind: "grass", title: "Herbe", lines: [] };
  switch (tile.kind) {
    case "hole": {
      const seed = save.inventory.seeds[nextSeedIndex(save.inventory.seeds, seedRarity)];
      return {
        kind: "hole",
        title: "Trou",
        lines: [
          seed
            ? `Prêt à recevoir une graine ${RARITY_FR[seed.rarity].toLowerCase()}`
            : "Plus de graines",
        ],
      };
    }
    case "leaves":
      return {
        kind: "leaves",
        title: "Tas de feuilles",
        lines: ["Un coup de râteau et c'est propre."],
      };
    case "decor":
      return { kind: "decor", title: DECOR_FR[tile.id], lines: ["Décor"] };
    case "plant":
      return describePlant(tile, now, rain);
  }
}

export const describeCrow = (): TileInfo => ({
  kind: "crow",
  title: "Corbeau",
  lines: ["Il picore tranquillement."],
});

function describePlant(plant: PlantTile, now: number, rain: RainSource): TileInfo {
  const g = growthOf(plant, now, rain);
  const { species, rarity } = plant.seed;
  if (g.stage === 4) {
    const how =
      harvestTool(species) === "secateur" ? "tige épaisse : sécateur" : "tige fine : à la main";
    return {
      kind: "plant",
      title: flowerName(plant.seed),
      lines: [`${RARITY_FR[rarity]} - ${how}`],
    };
  }

  const remaining = (1 - g.stageProgress) * (GROWTH_MS[rarity] / 4);
  const wetEnd = wetIntervals(plant, now, rain).find((i) => now >= i.start && now < i.end)?.end;
  const wetLeft = wetEnd ? wetEnd - now : 0;
  const real =
    remaining <= wetLeft * RATE ? remaining / RATE : wetLeft + (remaining - wetLeft * RATE);

  const lines = [
    `Prochaine étape dans ~${formatDuration(real)}`,
    wetEnd
      ? `Mouillée encore ${formatDuration(wetLeft)}`
      : "Terre sèche : arrose pour pousser plus vite",
  ];
  if (plant.revealed) lines.push(`Révélée : ${flowerName(plant.seed)}`);
  else if (g.stage === 0) lines.push("Espèce et couleur inconnues");
  return { kind: "plant", title: STAGE_FR[g.stage], lines, progress: g.stageProgress };
}

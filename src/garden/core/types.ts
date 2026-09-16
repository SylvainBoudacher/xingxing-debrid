export type Rarity = "commune" | "rare" | "epique" | "legendaire";

export type SpeciesId =
  | "tournesol"
  | "rosetremiere"
  | "dahlia"
  | "cosmos"
  | "aster"
  | "chrysantheme"
  | "bruyere"
  | "colchique";

export type ColorId =
  "yellow" | "pink" | "white" | "violet" | "red" | "orange" | "bronze" | "heather" | "lilac";

export type VariantId = "givree" | "doree" | "lumineuse";
export type DecorId = "lanterne" | "citrouille" | "paille";
export type PlotId = "p1";
export type Stage = 0 | 1 | 2 | 3 | 4;

// "x,y" en coordonnées de case
export type TileKey = `${number},${number}`;

export interface Interval {
  start: number;
  end: number;
}

export interface Seed {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant?: VariantId;
  hybrid?: boolean;
}

export interface Flower {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant?: VariantId;
}

export interface PlantTile {
  kind: "plant";
  seed: Seed;
  sownAt: number;
  watered: Interval[];
}

export type TileContent =
  | { kind: "hole"; dugAt: number }
  | PlantTile
  | { kind: "decor"; id: DecorId }
  | { kind: "leaves"; since: number };

export interface HerbierEntry {
  discoveredAt: number;
  pressed: number;
  variants: VariantId[];
}

export interface GardenSave {
  version: 1;
  tiles: Partial<Record<TileKey, TileContent>>;
  plots: PlotId[];
  inventory: {
    seeds: Seed[];
    basket: Flower[];
    potions: Record<string, number>;
    decor: Record<string, number>;
  };
  herbier: Record<string, HerbierEntry>;
  pity: { dryDiscovery: number; dryRare: number };
  sachets: { lastDailyAt: number; pending: number };
  progress: { nodes: Record<string, number>; counters: Record<string, number> };
  atelier: { brew: { recipe: string; startedAt: number } | null };
  leaves: { checkedAt: number };
}

export const tileKey = (x: number, y: number): TileKey => `${x},${y}`;

export function parseTileKey(key: TileKey): [number, number] {
  const [x, y] = key.split(",").map(Number);
  return [x, y];
}

import type { ColorId } from "./catalog/colors";
import type { SpeciesId } from "./catalog/species";

export type Rarity = "commune" | "rare" | "epique" | "legendaire";

export const BUILDING_IDS = ["etal", "cabane", "atelier", "serre"] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export type ParcelId = string;

export interface Point {
  x: number;
  z: number;
}

export type CameraMode = "follow" | "free";

// x, z : point visé au sol
export interface CameraState {
  x: number;
  z: number;
  mode: CameraMode;
}

export type Grade = "parfait" | "bien" | "rate";

export const TOOL_IDS = ["beche", "arrosoir", "serfouette"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

// water : arrosages restants (0 à 5), arrosoir seulement
export interface Tool {
  id: ToolId;
  water?: number;
}

export interface Seed {
  rarity: Rarity;
  species: SpeciesId;
  color: ColorId;
}

export type Quality = "belle" | "ordinaire";

export interface FlowerStack {
  kind: "flowers";
  species: SpeciesId;
  color: ColorId;
  quality: Quality;
  count: number;
}

export interface SeedStack {
  kind: "seeds";
  rarity: Rarity;
  seeds: Seed[];
}

export type Slot = { kind: "tool"; tool: Tool } | SeedStack | FlowerStack;
export type ChestStack = SeedStack | FlowerStack;

// progress 0..1 ; wetUntil en temps de jeu ; seen faux tant que l'éclosion n'a pas été montrée
export type Cell =
  | { kind: "herbe" }
  | { kind: "bechee"; loose: boolean }
  | {
      kind: "plante";
      seed: Seed;
      progress: number;
      loose: boolean;
      sowGrade: Grade;
      wetUntil: number;
      wetGrade: Grade;
      seen: boolean;
    };

export interface HerbierEntry {
  discoveredAt: number;
  announced: boolean;
}

// présente quand le temps de jeu atteint `at` (repousse programmée après un désherbage raté)
export interface Weed {
  at: number;
}

export interface Crow {
  leaveAt: number;
}

export const FOREST_KINDS = ["champignon", "gland"] as const;
export type ForestItemKind = (typeof FOREST_KINDS)[number];

export interface PotagerSave {
  version: 1;
  playTimeMs: number;
  camera: CameraState;
  avatar: Point;
  buildings: BuildingId[];
  parcels: ParcelId[];
  cells: Record<string, Cell>;
  inventory: (Slot | null)[];
  rack: Tool[];
  chest: ChestStack[];
  herbier: Record<string, HerbierEntry>;
  weeds: Record<string, Weed>;
  crows: Record<string, Crow>;
  // indice dans MAP.forest
  forest: Record<number, ForestItemKind>;
}

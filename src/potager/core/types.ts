import type { ColorId } from "./catalog/colors";
import type { SpeciesId } from "./catalog/species";

export type Rarity = "commune" | "rare" | "epique" | "legendaire";

export const BUILDING_IDS = ["etal", "cabane", "atelier", "serre", "maison"] as const;
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
// level : absent = niveau 1
export interface Tool {
  id: ToolId;
  water?: number;
  level?: 2;
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

export interface Demand {
  species: SpeciesId;
  color: ColorId;
}

// look : indice d'apparence, 0 à CLIENT_LOOKS - 1
export interface Client {
  demand: Demand;
  look: number;
}

// ordre d'embauche
export const STAFF_IDS = ["arroseur", "jardinier", "cueilleur", "fleuriste"] as const;
export type StaffId = (typeof STAFF_IDS)[number];

// maxRarity : jardinier seulement ; active : fleuriste seulement
export interface Hired {
  level: 1 | 2 | 3 | 4 | 5;
  parcels: ParcelId[];
  maxRarity: Rarity;
  active: boolean;
}

export interface Carry {
  seeds: Seed[];
  flowers: FlowerStack[];
}

export type StaffGesture =
  | "arroser"
  | "chasser"
  | "desherber"
  | "becher"
  | "semer"
  | "cueillir"
  | "servir"
  | "remplir"
  | "deposer"
  | "prendre";

export type StaffStatus =
  | { kind: "idle" }
  | { kind: "pause" }
  | { kind: "work"; gesture: StaffGesture; cell: string }
  | { kind: "puits" }
  | { kind: "abri" }
  | { kind: "etal" }
  | { kind: "noSeeds" }
  | { kind: "chestFull" };

export interface StaffTask {
  gesture: StaffGesture;
  cell?: string;
  stand: Point;
}

// doneAt : temps de jeu de fin du geste en cours, null en marche ou au repos
export interface Worker {
  pos: Point;
  path: Point[];
  task: StaffTask | null;
  doneAt: number | null;
  carry: Carry;
  water: number;
  status: StaffStatus;
}

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
  po: number;
  stall: FlowerStack[];
  stallLevel: number;
  chestLevel: number;
  client: Client | null;
  nextClientAt: number;
  staff: Partial<Record<StaffId, Hired>>;
  // état d'exécution de l'équipe : jamais écrit sur disque (storedSave)
  crew: Partial<Record<StaffId, Worker>>;
  // case (ou "etal") du mini-jeu en cours du joueur
  playerBusy: string | null;
}

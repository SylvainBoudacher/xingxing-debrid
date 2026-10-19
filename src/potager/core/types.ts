export type Rarity = "commune" | "rare" | "epique" | "legendaire";

export const BUILDING_IDS = ["etal", "cabane", "atelier", "serre"] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export type ParcelId = string;

export type CameraMode = "follow" | "free";

// x, z : point visé au sol
export interface CameraState {
  x: number;
  z: number;
  mode: CameraMode;
}

export interface PotagerSave {
  version: 1;
  playTimeMs: number;
  camera: CameraState;
  buildings: BuildingId[];
  parcels: ParcelId[];
}

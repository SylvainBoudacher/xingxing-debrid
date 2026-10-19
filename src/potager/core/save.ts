import { MAP } from "./catalog/map";
import {
  BUILDING_IDS,
  type BuildingId,
  type CameraState,
  type Point,
  type PotagerSave,
} from "./types";

export function createStarterSave(): PotagerSave {
  return {
    version: 1,
    playTimeMs: 0,
    camera: { ...MAP.spawnView, mode: "follow" },
    avatar: { ...MAP.spawn },
    buildings: ["etal", "cabane"],
    parcels: ["p0"],
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBuilding = (v: unknown): v is BuildingId => BUILDING_IDS.includes(v as BuildingId);

function parseCamera(v: unknown): CameraState | null {
  if (!isObject(v) || !isNumber(v.x) || !isNumber(v.z)) return null;
  if (v.mode !== "follow" && v.mode !== "free") return null;
  return { x: v.x, z: v.z, mode: v.mode };
}

// absente des sauvegardes d'avant le déplacement : point de départ
const parsePoint = (v: unknown): Point =>
  isObject(v) && isNumber(v.x) && isNumber(v.z) ? { x: v.x, z: v.z } : { ...MAP.spawn };

export function parseSave(raw: unknown): PotagerSave | null {
  if (!isObject(raw) || raw.version !== 1 || !isNumber(raw.playTimeMs)) return null;
  const camera = parseCamera(raw.camera);
  if (!camera) return null;
  const { buildings, parcels } = raw;
  if (!Array.isArray(buildings) || !buildings.every(isBuilding)) return null;
  if (!Array.isArray(parcels) || !parcels.every((p) => typeof p === "string")) return null;
  return {
    version: 1,
    playTimeMs: raw.playTimeMs,
    camera,
    avatar: parsePoint(raw.avatar),
    buildings: [...buildings],
    parcels: [...parcels],
  };
}

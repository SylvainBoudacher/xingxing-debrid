import { parcelCells } from "../cells";
import { createStarterSave } from "../save";
import { rollSeed, seededRng } from "../seeds";
import type { Cell, Hired, PotagerSave, Rarity, Seed } from "../types";

export const P0 = parcelCells("p0").map((c) => c.key);

export const seedOf = (rarity: Rarity, n = 1): Seed[] => {
  const rng = seededRng(7);
  return Array.from({ length: n }, () => rollSeed(rarity, rng));
};

export const plant = (
  seed: Seed,
  extra: Partial<Extract<Cell, { kind: "plante" }>> = {},
): Cell => ({
  kind: "plante",
  seed,
  progress: 0.2,
  loose: false,
  sowGrade: "bien",
  wetUntil: 0,
  wetGrade: "rate",
  seen: true,
  ...extra,
});

export const hired = (level: Hired["level"] = 1, extra: Partial<Hired> = {}): Hired => ({
  level,
  parcels: ["p0"],
  maxRarity: "commune",
  active: true,
  ...extra,
});

// partie avec la maison construite
export const village = (extra: Partial<PotagerSave> = {}): PotagerSave => ({
  ...createStarterSave(),
  buildings: ["etal", "cabane", "maison"],
  playTimeMs: 1_000_000,
  ...extra,
});

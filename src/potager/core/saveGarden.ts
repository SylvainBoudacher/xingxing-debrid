import { RARITIES } from "./catalog/rarity";
import { isSpeciesId, rarityOf } from "./catalog/species";
import type { ColorId } from "./catalog/colors";
import { parcelCells } from "./cells";
import { rollSeed, seededRng } from "./seeds";
import {
  TOOL_IDS,
  type Cell,
  type ChestStack,
  type FlowerStack,
  type Grade,
  type HerbierEntry,
  type ParcelId,
  type Rarity,
  type Seed,
  type SeedStack,
  type Slot,
  type Tool,
  type ToolId,
} from "./types";

export const SLOTS = 6;

export function starterGarden(parcels: readonly ParcelId[]) {
  const rng = seededRng(1);
  return {
    cells: starterCells(parcels),
    inventory: [
      {
        kind: "seeds",
        rarity: "commune",
        seeds: Array.from({ length: 5 }, () => rollSeed("commune", rng)),
      },
      ...Array<null>(SLOTS - 1).fill(null),
    ] as (Slot | null)[],
    rack: [{ id: "beche" }, { id: "arrosoir", water: 5 }, { id: "serfouette" }] as Tool[],
    chest: [] as ChestStack[],
    herbier: {} as Record<string, HerbierEntry>,
  };
}

const starterCells = (parcels: readonly ParcelId[]) =>
  Object.fromEntries(
    parcels.flatMap((p) => parcelCells(p).map((c) => [c.key, { kind: "herbe" } as Cell])),
  );

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isRarity = (v: unknown): v is Rarity => RARITIES.includes(v as Rarity);
const isGrade = (v: unknown): v is Grade => v === "parfait" || v === "bien" || v === "rate";
const isToolId = (v: unknown): v is ToolId => TOOL_IDS.includes(v as ToolId);
const isEntry = (species: unknown, color: unknown) =>
  typeof species === "string" &&
  isSpeciesId(species) &&
  typeof color === "string" &&
  rarityOf(species, color as ColorId) !== null;

function parseSeed(v: unknown): Seed | null {
  if (!isObject(v) || !isEntry(v.species, v.color)) return null;
  const s = { species: v.species, color: v.color } as Omit<Seed, "rarity">;
  return { ...s, rarity: rarityOf(s.species, s.color)! };
}

function parseTool(v: unknown): Tool | null {
  if (!isObject(v) || !isToolId(v.id)) return null;
  if (v.id !== "arrosoir") return { id: v.id };
  return {
    id: "arrosoir",
    water: isNumber(v.water) ? Math.min(5, Math.max(0, Math.round(v.water))) : 0,
  };
}

function parseStack(v: unknown): SeedStack | FlowerStack | null {
  if (!isObject(v)) return null;
  if (v.kind === "seeds" && isRarity(v.rarity) && Array.isArray(v.seeds)) {
    const seeds = v.seeds.map(parseSeed);
    if (!seeds.length || seeds.some((s) => !s || s.rarity !== v.rarity)) return null;
    return { kind: "seeds", rarity: v.rarity, seeds: seeds as Seed[] };
  }
  if (
    v.kind === "flowers" &&
    isEntry(v.species, v.color) &&
    (v.quality === "belle" || v.quality === "ordinaire") &&
    isNumber(v.count) &&
    v.count >= 1
  )
    return {
      kind: "flowers",
      species: v.species as FlowerStack["species"],
      color: v.color as ColorId,
      quality: v.quality,
      count: Math.floor(v.count),
    };
  return null;
}

function parseSlot(v: unknown): Slot | null | undefined {
  if (v === null) return null;
  if (isObject(v) && v.kind === "tool") {
    const tool = parseTool(v.tool);
    return tool ? { kind: "tool", tool } : undefined;
  }
  return parseStack(v) ?? undefined;
}

function parseCell(v: unknown): Cell | null {
  if (!isObject(v)) return null;
  if (v.kind === "herbe") return { kind: "herbe" };
  if (v.kind === "bechee") return { kind: "bechee", loose: v.loose === true };
  if (v.kind !== "plante") return null;
  const seed = parseSeed(v.seed);
  if (!seed || !isNumber(v.progress) || v.progress < 0 || v.progress > 1) return null;
  if (!isNumber(v.wetUntil) || !isGrade(v.sowGrade) || !isGrade(v.wetGrade)) return null;
  return {
    kind: "plante",
    seed,
    progress: v.progress,
    loose: v.loose === true,
    sowGrade: v.sowGrade,
    wetUntil: v.wetUntil,
    wetGrade: v.wetGrade,
    seen: v.seen !== false,
  };
}

// Champs ajoutés après la première sauvegarde : absents ou abîmés, ils reprennent leur valeur de départ.
export function parseGarden(raw: Record<string, unknown>, parcels: readonly ParcelId[]) {
  const start = starterGarden(parcels);
  const cells = starterCells(parcels);
  if (isObject(raw.cells))
    for (const key of Object.keys(cells))
      cells[key] = parseCell(raw.cells[key]) ?? { kind: "herbe" };

  const slots =
    Array.isArray(raw.inventory) && raw.inventory.length === SLOTS
      ? raw.inventory.map(parseSlot)
      : null;
  const inventory =
    slots && !slots.includes(undefined) ? (slots as (Slot | null)[]) : start.inventory;

  const rack = Array.isArray(raw.rack) ? raw.rack.map(parseTool) : null;
  const chest = Array.isArray(raw.chest) ? raw.chest.map(parseStack) : null;
  const herbier = isObject(raw.herbier)
    ? Object.fromEntries(
        Object.entries(raw.herbier).flatMap(([k, e]) =>
          isObject(e) && isNumber(e.discoveredAt) && isEntry(...(k.split(":") as [string, string]))
            ? [[k, { discoveredAt: e.discoveredAt, announced: e.announced === true }]]
            : [],
        ),
      )
    : start.herbier;

  return {
    cells,
    inventory,
    rack: rack && !rack.includes(null) ? (rack as Tool[]) : start.rack,
    chest: chest && !chest.includes(null) ? (chest as ChestStack[]) : start.chest,
    herbier,
  };
}

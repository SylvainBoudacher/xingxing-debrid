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
  type Weed,
  type Crow,
  type Client,
  type ForestItemKind,
  FOREST_KINDS,
} from "./types";
import { MAP } from "./catalog/map";
import { CHEST_SIZES, CLIENT_LOOKS, STALL_SIZES } from "./economy/catalog";

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
    weeds: {} as Record<string, Weed>,
    crows: {} as Record<string, Crow>,
    forest: {} as Record<number, ForestItemKind>,
    po: 0,
    stall: [] as FlowerStack[],
    stallLevel: 0,
    chestLevel: 0,
    client: null as Client | null,
    nextClientAt: 0,
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
  const level = v.level === 2 ? { level: 2 as const } : {};
  if (v.id !== "arrosoir") return { id: v.id, ...level };
  return {
    id: "arrosoir",
    water: isNumber(v.water) ? Math.min(5, Math.max(0, Math.round(v.water))) : 0,
    ...level,
  };
}

const parseCount = (v: unknown) => (isNumber(v) ? Math.max(0, Math.floor(v)) : 0);
const parseLevel = (v: unknown, sizes: number[]) =>
  isNumber(v) ? Math.min(sizes.length - 1, Math.max(0, Math.floor(v))) : 0;

function parseClient(v: unknown): Client | null {
  if (!isObject(v) || !isObject(v.demand)) return null;
  const { species, color } = v.demand;
  if (!isEntry(species, color)) return null;
  if (!Number.isInteger(v.look) || (v.look as number) < 0 || (v.look as number) >= CLIENT_LOOKS)
    return null;
  return {
    demand: { species: species as Client["demand"]["species"], color: color as ColorId },
    look: v.look as number,
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

  const rack = Array.isArray(raw.rack)
    ? raw.rack.map(parseTool).filter((t): t is Tool => t !== null)
    : null;
  const chest = Array.isArray(raw.chest) ? raw.chest.map(parseStack) : null;
  const stall = Array.isArray(raw.stall) ? raw.stall.map(parseStack) : null;
  const herbier = isObject(raw.herbier)
    ? Object.fromEntries(
        Object.entries(raw.herbier).flatMap(([k, e]) =>
          isObject(e) && isNumber(e.discoveredAt) && isEntry(...(k.split(":") as [string, string]))
            ? [[k, { discoveredAt: e.discoveredAt, announced: e.announced === true }]]
            : [],
        ),
      )
    : start.herbier;

  const keyed = <T>(v: unknown, field: string, keep: (k: string) => boolean): Record<string, T> =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v).flatMap(([k, e]) =>
            keep(k) && isObject(e) && isNumber(e[field]) ? [[k, { [field]: e[field] } as T]] : [],
          ),
        )
      : {};
  const isCell = (k: string) => k in cells;
  const forest = isObject(raw.forest)
    ? Object.fromEntries(
        Object.entries(raw.forest).filter(
          ([k, kind]) =>
            Number.isInteger(Number(k)) &&
            Number(k) >= 0 &&
            Number(k) < MAP.forest.length &&
            FOREST_KINDS.includes(kind as ForestItemKind),
        ),
      )
    : {};

  const tools = uniqueTools(inventory, rack ?? start.rack);
  return {
    cells,
    ...tools,
    chest: chest && !chest.includes(null) ? (chest as ChestStack[]) : start.chest,
    herbier,
    weeds: keyed<Weed>(raw.weeds, "at", isCell),
    crows: keyed<Crow>(raw.crows, "leaveAt", isCell),
    forest: forest as Record<number, ForestItemKind>,
    po: parseCount(raw.po),
    stall:
      stall && stall.every((x): x is FlowerStack => x?.kind === "flowers") ? stall : start.stall,
    stallLevel: parseLevel(raw.stallLevel, STALL_SIZES),
    chestLevel: parseLevel(raw.chestLevel, CHEST_SIZES),
    client: parseClient(raw.client),
    nextClientAt: isNumber(raw.nextClientAt) ? Math.max(0, raw.nextClientAt) : 0,
  };
}

// Chaque outil existe exactement une fois : le sac l'emporte, un outil disparu revient au râtelier.
function uniqueTools(inventory: (Slot | null)[], rack: Tool[]) {
  const inBag = new Set<ToolId>();
  const bag = inventory.map((s) => {
    if (s?.kind !== "tool") return s;
    if (inBag.has(s.tool.id)) return null;
    inBag.add(s.tool.id);
    return s;
  });
  const kept = rack.filter(
    (t, i) => !inBag.has(t.id) && rack.findIndex((x) => x.id === t.id) === i,
  );
  const missing = TOOL_IDS.filter((id) => !inBag.has(id) && !kept.some((t) => t.id === id));
  return {
    inventory: bag,
    rack: [...kept, ...missing.map((id): Tool => (id === "arrosoir" ? { id, water: 0 } : { id }))],
  };
}

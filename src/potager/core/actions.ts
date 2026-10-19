import { MAP } from "./catalog/map";
import { ROLL_HARVEST } from "./catalog/rarity";
import { cellAt, parcelCells } from "./cells";
import { stageOf, WET_MS } from "./growth";
import { addFlower, addSeed, hasTool, setWater, STACK, takeSeed, waterLeft } from "./inventory";
import { rollRarity, rollSeed } from "./seeds";
import type { Grade, Point, PotagerSave, Rarity, Slot } from "./types";

export type Target = { kind: "cell"; key: string } | { kind: "abri" } | { kind: "puits" };
export type Gesture = "becher" | "semer" | "arroser" | "cueillir" | "puits" | "abri";
export type ActionEvent = { kind: "graine"; rarity: Rarity };

export const REACH = 1.2;
const AHEAD = 0.8;
const BONUS_SEED: Record<Grade, number> = { parfait: 0.3, bien: 0.2, rate: 0.1 };

const abriGap = (p: Point) =>
  Math.hypot(
    Math.max(0, Math.abs(p.x - MAP.abri.x) - MAP.abri.w / 2),
    Math.max(0, Math.abs(p.z - MAP.abri.z) - MAP.abri.d / 2),
  );
const puitsGap = (p: Point) => Math.hypot(p.x - MAP.puits.x, p.z - MAP.puits.z) - MAP.puits.r;

// la case devant l'avatar, sinon l'abri ou le puits à portée
export function findTarget(save: PotagerSave, pose: Point & { dir: Point }): Target | null {
  const ahead = { x: pose.x + pose.dir.x * AHEAD, z: pose.z + pose.dir.z * AHEAD };
  const c = cellAt(ahead, save.parcels);
  if (c) return { kind: "cell", key: c.key };
  if (abriGap(pose) < REACH) return { kind: "abri" };
  if (puitsGap(pose) < REACH) return { kind: "puits" };
  return null;
}

// où se tenir pour agir : devant, côté caméra
export function standPoint(t: Target): Point {
  if (t.kind === "abri") return { x: MAP.abri.x, z: MAP.abri.z + MAP.abri.d / 2 + 0.6 };
  if (t.kind === "puits") return { x: MAP.puits.x, z: MAP.puits.z + MAP.puits.r + 0.6 };
  const c = Object.values(MAP.parcels)
    .flatMap((p) => parcelCells(p.id))
    .find((x) => x.key === t.key);
  return c ? { x: c.center.x, z: c.center.z + 0.9 } : { ...MAP.spawn };
}

const needTool = (tool: "la bêche" | "l'arrosoir", pronoun: "elle" | "il") =>
  `Il te faut ${tool} (${pronoun} est à l'abri)`;

export function prepareAction(
  save: PotagerSave,
  target: Target,
  selectedSlot: number,
): { gesture: Gesture } | { message: string } {
  const inv = save.inventory;
  if (target.kind === "abri") return { gesture: "abri" };
  if (target.kind === "puits")
    return hasTool(inv, "arrosoir")
      ? { gesture: "puits" }
      : { message: needTool("l'arrosoir", "il") };
  const c = save.cells[target.key];
  if (!c) return { message: "Rien à faire ici" };
  if (c.kind === "herbe")
    return hasTool(inv, "beche")
      ? { gesture: "becher" }
      : { message: needTool("la bêche", "elle") };
  if (c.kind === "bechee")
    return takeSeed(inv, selectedSlot) ? { gesture: "semer" } : { message: "Plus de graines" };
  if (stageOf(c.progress) === 4)
    return addFlower(inv, { species: c.seed.species, color: c.seed.color, quality: "belle" }) ||
      addFlower(inv, { species: c.seed.species, color: c.seed.color, quality: "ordinaire" })
      ? { gesture: "cueillir" }
      : { message: "Ton sac est plein" };
  if (!hasTool(inv, "arrosoir")) return { message: needTool("l'arrosoir", "il") };
  return waterLeft(inv) > 0 ? { gesture: "arroser" } : { message: "L'arrosoir est vide" };
}

const seedRoom = (inv: (Slot | null)[]) =>
  inv.some((s) => s === null || (s.kind === "seeds" && s.seeds.length < STACK));

export function applyAction(
  save: PotagerSave,
  target: Target,
  gesture: Gesture,
  result: { grade: Grade; water?: number },
  selectedSlot: number,
  rng: () => number,
): { save: PotagerSave; events: ActionEvent[] } {
  const unchanged = { save, events: [] as ActionEvent[] };
  const p = prepareAction(save, target, selectedSlot);
  if (!("gesture" in p) || p.gesture !== gesture) return unchanged;
  const { grade } = result;

  if (gesture === "puits")
    return {
      save: {
        ...save,
        inventory: setWater(save.inventory, Math.max(1, Math.round(5 * (result.water ?? 0)))),
      },
      events: [],
    };
  if (target.kind !== "cell") return unchanged;
  const c = save.cells[target.key];
  const withCell = (cell: typeof c, extra: Partial<PotagerSave> = {}) => ({
    ...save,
    ...extra,
    cells: { ...save.cells, [target.key]: cell },
  });

  if (gesture === "becher")
    return { save: withCell({ kind: "bechee", loose: grade === "parfait" }), events: [] };

  if (gesture === "semer" && c.kind === "bechee") {
    const taken = takeSeed(save.inventory, selectedSlot)!;
    const plant = {
      kind: "plante" as const,
      seed: taken.seed,
      progress: 0,
      loose: c.loose,
      sowGrade: grade,
      wetUntil: 0,
      wetGrade: "rate" as const,
      seen: true,
    };
    return { save: withCell(plant, { inventory: taken.inv }), events: [] };
  }

  if (gesture === "arroser" && c.kind === "plante") {
    const inventory = setWater(save.inventory, waterLeft(save.inventory) - 1);
    return {
      save: withCell({ ...c, wetUntil: save.playTimeMs + WET_MS, wetGrade: grade }, { inventory }),
      events: [],
    };
  }

  if (gesture === "cueillir" && c.kind === "plante") {
    const quality = grade === "parfait" ? "belle" : "ordinaire";
    let inventory = addFlower(save.inventory, {
      species: c.seed.species,
      color: c.seed.color,
      quality,
    });
    if (!inventory) return unchanged;
    const events: ActionEvent[] = [];
    // pas de tirage sans place : aucune graine n'est trouvée puis perdue
    if (seedRoom(inventory) && rng() < BONUS_SEED[grade]) {
      const seed = rollSeed(rollRarity(ROLL_HARVEST, rng), rng);
      const added = addSeed(inventory, seed);
      if (added) {
        inventory = added;
        events.push({ kind: "graine", rarity: seed.rarity });
      }
    }
    return { save: withCell({ kind: "herbe" }, { inventory }), events };
  }
  return unchanged;
}

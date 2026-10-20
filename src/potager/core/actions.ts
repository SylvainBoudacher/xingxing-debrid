import { MAP, parcelSign } from "./catalog/map";
import { ROLL_HARVEST } from "./catalog/rarity";
import { cellAt, parcelCells } from "./cells";
import { markSeen, stageOf, WET_MS } from "./growth";
import type { ColorId } from "./catalog/colors";
import type { SpeciesId } from "./catalog/species";
import { addFlower, addSeed, hasTool, setWater, STACK, takeSeed, waterLeft } from "./inventory";
import { FOREST_ROLL } from "./forest";
import { hasWeed } from "./nuisances";
import { rollRarity, rollSeed } from "./seeds";
import type { Grade, ParcelId, Point, PotagerSave, Rarity, Slot } from "./types";

export type Target =
  | { kind: "cell"; key: string }
  | { kind: "abri" }
  | { kind: "puits" }
  | { kind: "etal" }
  | { kind: "cabane" }
  | { kind: "panneau"; parcel: ParcelId }
  | { kind: "foret"; spot: number };
export type Gesture =
  | "becher"
  | "semer"
  | "arroser"
  | "cueillir"
  | "puits"
  | "abri"
  | "desherber"
  | "ramasser"
  | "etal"
  | "cabane"
  | "panneau"
  | "servir";
export type ActionEvent =
  { kind: "graine"; rarity: Rarity } | { kind: "decouverte"; species: SpeciesId; color: ColorId };

export const REACH = 1.2;
const AHEAD = 0.8;
const BONUS_SEED: Record<Grade, number> = { parfait: 0.3, bien: 0.2, rate: 0.1 };
const WEED_REGROW_MS = 60_000;

const rectGap = (p: Point, r: { x: number; z: number; w: number; d: number }) =>
  Math.hypot(
    Math.max(0, Math.abs(p.x - r.x) - r.w / 2),
    Math.max(0, Math.abs(p.z - r.z) - r.d / 2),
  );
const abriGap = (p: Point) => rectGap(p, MAP.abri);
const building = (id: "etal" | "cabane") => MAP.buildings.find((b) => b.id === id)!;
const puitsGap = (p: Point) => Math.hypot(p.x - MAP.puits.x, p.z - MAP.puits.z) - MAP.puits.r;

// la case devant l'avatar (ou sous lui), sinon l'abri, le puits ou un objet de forêt à portée
export function findTarget(save: PotagerSave, pose: Point & { dir: Point }): Target | null {
  const ahead = { x: pose.x + pose.dir.x * AHEAD, z: pose.z + pose.dir.z * AHEAD };
  // devant soi d'abord, sinon la case où l'on se tient
  const c = cellAt(ahead, save.parcels) ?? cellAt(pose, save.parcels);
  if (c) return { kind: "cell", key: c.key };
  if (abriGap(pose) < REACH) return { kind: "abri" };
  if (puitsGap(pose) < REACH) return { kind: "puits" };
  const spot = Object.keys(save.forest)
    .map(Number)
    .find((i) => Math.hypot(MAP.forest[i].x - pose.x, MAP.forest[i].z - pose.z) < REACH);
  if (spot !== undefined) return { kind: "foret", spot };
  if (rectGap(pose, building("etal")) < REACH) return { kind: "etal" };
  if (rectGap(pose, building("cabane")) < REACH) return { kind: "cabane" };
  const sign = MAP.parcels.find(
    (p) =>
      !save.parcels.includes(p.id) &&
      Math.hypot(parcelSign(p.id).x - pose.x, parcelSign(p.id).z - pose.z) < REACH,
  );
  if (sign) return { kind: "panneau", parcel: sign.id };
  return null;
}

// où se tenir pour agir : devant, côté caméra
export function standPoint(t: Target): Point {
  if (t.kind === "abri") return { x: MAP.abri.x, z: MAP.abri.z + MAP.abri.d / 2 + 0.6 };
  if (t.kind === "puits") return { x: MAP.puits.x, z: MAP.puits.z + MAP.puits.r + 0.6 };
  if (t.kind === "foret") return { x: MAP.forest[t.spot].x, z: MAP.forest[t.spot].z + 0.6 };
  if (t.kind === "etal" || t.kind === "cabane") {
    const b = building(t.kind);
    return { x: b.x, z: b.z + b.d / 2 + 0.6 };
  }
  if (t.kind === "panneau") {
    const s = parcelSign(t.parcel);
    return { x: s.x, z: s.z + 0.6 };
  }
  const c = MAP.parcels.flatMap((p) => parcelCells(p.id)).find((x) => x.key === t.key);
  return c ? { x: c.center.x, z: c.center.z + 0.9 } : { ...MAP.spawn };
}

const TOOL_NAME = {
  beche: ["la bêche", "elle"],
  arrosoir: ["l'arrosoir", "il"],
  serfouette: ["la serfouette", "elle"],
} as const;

const IN_HAND = "en main (touches 1 à 6)";

// L'outil doit être en main (case sélectionnée du sac) ; s'il est ailleurs dans le sac,
// on le dit, sinon il est resté à l'abri.
function toolCheck(inv: (Slot | null)[], hand: number, id: keyof typeof TOOL_NAME): string | null {
  const held = inv[hand];
  if (held?.kind === "tool" && held.tool.id === id) return null;
  const [name, pronoun] = TOOL_NAME[id];
  if (hasTool(inv, id)) return `Prends ${name} ${IN_HAND}`;
  return `Il te faut ${name} (${pronoun} est à l'abri)`;
}

export function prepareAction(
  save: PotagerSave,
  target: Target,
  hand: number,
): { gesture: Gesture } | { message: string } {
  const inv = save.inventory;
  if (target.kind === "abri") return { gesture: "abri" };
  if (target.kind === "etal" || target.kind === "cabane" || target.kind === "panneau")
    return { gesture: target.kind };
  if (target.kind === "puits") {
    const missing = toolCheck(inv, hand, "arrosoir");
    return missing ? { message: missing } : { gesture: "puits" };
  }
  if (target.kind === "foret") {
    if (!save.forest[target.spot]) return { message: "Il n'y a plus rien ici" };
    // la rareté n'est connue qu'au tirage : seule une case libre garantit la place
    return inv.includes(null) ? { gesture: "ramasser" } : { message: "Ton sac est plein" };
  }
  const c = save.cells[target.key];
  if (!c) return { message: "Rien à faire ici" };
  // une mauvaise herbe passe avant tout autre geste sur la case
  if (hasWeed(save, target.key)) {
    const missing = toolCheck(inv, hand, "serfouette");
    return missing ? { message: missing } : { gesture: "desherber" };
  }
  if (c.kind === "herbe") {
    const missing = toolCheck(inv, hand, "beche");
    return missing ? { message: missing } : { gesture: "becher" };
  }
  if (c.kind === "bechee") {
    if (inv[hand]?.kind === "seeds") return { gesture: "semer" };
    return inv.some((x) => x?.kind === "seeds")
      ? { message: `Prends des graines ${IN_HAND}` }
      : { message: "Plus de graines" };
  }
  // cueillir se fait à mains nues
  if (stageOf(c.progress) === 4)
    return addFlower(inv, { species: c.seed.species, color: c.seed.color, quality: "belle" }) ||
      addFlower(inv, { species: c.seed.species, color: c.seed.color, quality: "ordinaire" })
      ? { gesture: "cueillir" }
      : { message: "Ton sac est plein" };
  const missing = toolCheck(inv, hand, "arrosoir");
  if (missing) return { message: missing };
  return waterLeft(inv) > 0 ? { gesture: "arroser" } : { message: "L'arrosoir est vide" };
}

const MULTI: Gesture[] = ["becher", "arroser", "desherber"];

// la case visée, plus ses deux voisines perpendiculaires au regard avec un outil de niveau 2
export function toolCells(save: PotagerSave, key: string, dir: Point, hand: number): string[] {
  const held = save.inventory[hand];
  const [parcel, col, row] = key.split(":");
  const first = prepareAction(save, { kind: "cell", key }, hand);
  if (held?.kind !== "tool" || held.tool.level !== 2) return [key];
  if (!("gesture" in first) || !MULTI.includes(first.gesture)) return [key];
  const alongRow = Math.abs(dir.x) >= Math.abs(dir.z);
  const near = [-1, 1]
    .map((d) => (alongRow ? `${parcel}:${col}:${+row + d}` : `${parcel}:${+col + d}:${row}`))
    .filter((k) => {
      if (!save.cells[k]) return false;
      const p = prepareAction(save, { kind: "cell", key: k }, hand);
      return "gesture" in p && p.gesture === first.gesture;
    });
  return [key, ...near];
}

function applyToCell(save: PotagerSave, key: string, gesture: Gesture, grade: Grade): PotagerSave {
  if (gesture === "desherber") {
    const weeds = { ...save.weeds };
    // racine cassée : l'herbe revient sur la même case une minute plus tard
    if (grade === "rate") weeds[key] = { at: save.playTimeMs + WEED_REGROW_MS };
    else delete weeds[key];
    return { ...save, weeds };
  }
  const c = save.cells[key];
  if (gesture === "becher")
    return {
      ...save,
      cells: { ...save.cells, [key]: { kind: "bechee", loose: grade === "parfait" } },
    };
  if (c.kind !== "plante") return save;
  const wet = { ...c, wetUntil: save.playTimeMs + WET_MS, wetGrade: grade };
  return { ...save, cells: { ...save.cells, [key]: wet } };
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
  dir: Point = { x: 0, z: -1 },
): { save: PotagerSave; events: ActionEvent[] } {
  const unchanged = { save, events: [] as ActionEvent[] };
  const p = prepareAction(save, target, selectedSlot);
  if (!("gesture" in p) || p.gesture !== gesture) return unchanged;
  const { grade } = result;

  if (gesture === "puits")
    return {
      save: {
        ...save,
        // l'eau remontée s'ajoute : un mauvais remplissage ne vide jamais l'arrosoir
        inventory: setWater(
          save.inventory,
          Math.max(waterLeft(save.inventory), 1, Math.round(5 * (result.water ?? 0))),
        ),
      },
      events: [],
    };
  if (gesture === "ramasser" && target.kind === "foret") {
    const kind = save.forest[target.spot];
    const seed = rollSeed(rollRarity(FOREST_ROLL[kind], rng), rng);
    const inventory = addSeed(save.inventory, seed);
    if (!inventory) return unchanged;
    const forest = { ...save.forest };
    delete forest[target.spot];
    return {
      save: { ...save, inventory, forest },
      events: [{ kind: "graine", rarity: seed.rarity }],
    };
  }
  if (target.kind !== "cell") return unchanged;
  if (MULTI.includes(gesture)) {
    let next = save;
    for (const k of toolCells(save, target.key, dir, selectedSlot))
      next = applyToCell(next, k, gesture, grade);
    if (gesture === "arroser")
      next = { ...next, inventory: setWater(save.inventory, waterLeft(save.inventory) - 1) };
    return { save: next, events: [] };
  }
  const c = save.cells[target.key];
  const withCell = (cell: typeof c, extra: Partial<PotagerSave> = {}) => ({
    ...save,
    ...extra,
    cells: { ...save.cells, [target.key]: cell },
  });

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

  if (gesture === "cueillir" && c.kind === "plante") {
    const quality = grade === "parfait" ? "belle" : "ordinaire";
    const flower = { species: c.seed.species, color: c.seed.color };
    // une belle fleur sans place se range comme ordinaire plutôt que de rester sur la case
    let inventory =
      addFlower(save.inventory, { ...flower, quality }) ??
      addFlower(save.inventory, { ...flower, quality: "ordinaire" });
    if (!inventory) return unchanged;
    const events: ActionEvent[] = [];
    // une fleur cueillie sans avoir été vue est annoncée ici
    const seen = markSeen(save, target.key);
    if (seen.announce) events.push({ kind: "decouverte", ...seen.announce });
    // pas de tirage sans place : aucune graine n'est trouvée puis perdue
    if (seedRoom(inventory) && rng() < BONUS_SEED[grade]) {
      const seed = rollSeed(rollRarity(ROLL_HARVEST, rng), rng);
      const added = addSeed(inventory, seed);
      if (added) {
        inventory = added;
        events.push({ kind: "graine", rarity: seed.rarity });
      }
    }
    return {
      save: { ...withCell({ kind: "herbe" }, { inventory }), herbier: seen.save.herbier },
      events,
    };
  }
  return unchanged;
}

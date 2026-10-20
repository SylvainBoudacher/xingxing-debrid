import { MAP } from "./catalog/map";
import { ROLL_HARVEST } from "./catalog/rarity";
import { cellAt, parcelCells } from "./cells";
import { markSeen, stageOf, WET_MS } from "./growth";
import type { ColorId } from "./catalog/colors";
import type { SpeciesId } from "./catalog/species";
import { addFlower, addSeed, hasTool, setWater, STACK, takeSeed, waterLeft } from "./inventory";
import { rollRarity, rollSeed } from "./seeds";
import type { Grade, Point, PotagerSave, Rarity, Slot } from "./types";

export type Target = { kind: "cell"; key: string } | { kind: "abri" } | { kind: "puits" };
export type Gesture = "becher" | "semer" | "arroser" | "cueillir" | "puits" | "abri";
export type ActionEvent =
  { kind: "graine"; rarity: Rarity } | { kind: "decouverte"; species: SpeciesId; color: ColorId };

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
  // devant soi d'abord, sinon la case où l'on se tient
  const c = cellAt(ahead, save.parcels) ?? cellAt(pose, save.parcels);
  if (c) return { kind: "cell", key: c.key };
  if (abriGap(pose) < REACH) return { kind: "abri" };
  if (puitsGap(pose) < REACH) return { kind: "puits" };
  return null;
}

// où se tenir pour agir : devant, côté caméra
export function standPoint(t: Target): Point {
  if (t.kind === "abri") return { x: MAP.abri.x, z: MAP.abri.z + MAP.abri.d / 2 + 0.6 };
  if (t.kind === "puits") return { x: MAP.puits.x, z: MAP.puits.z + MAP.puits.r + 0.6 };
  const c = MAP.parcels.flatMap((p) => parcelCells(p.id)).find((x) => x.key === t.key);
  return c ? { x: c.center.x, z: c.center.z + 0.9 } : { ...MAP.spawn };
}

const needTool = (tool: "la bêche" | "l'arrosoir", pronoun: "elle" | "il") =>
  `Il te faut ${tool} (${pronoun} est à l'abri)`;

const IN_HAND = "en main (touches 1 à 6)";

// L'outil doit être en main (case sélectionnée du sac) ; s'il est ailleurs dans le sac,
// on le dit, sinon il est resté à l'abri.
function toolCheck(inv: (Slot | null)[], hand: number, id: "beche" | "arrosoir"): string | null {
  const held = inv[hand];
  if (held?.kind === "tool" && held.tool.id === id) return null;
  const name = id === "beche" ? "la bêche" : "l'arrosoir";
  if (hasTool(inv, id)) return `Prends ${name} ${IN_HAND}`;
  return needTool(name as "la bêche" | "l'arrosoir", id === "beche" ? "elle" : "il");
}

export function prepareAction(
  save: PotagerSave,
  target: Target,
  hand: number,
): { gesture: Gesture } | { message: string } {
  const inv = save.inventory;
  if (target.kind === "abri") return { gesture: "abri" };
  if (target.kind === "puits") {
    const missing = toolCheck(inv, hand, "arrosoir");
    return missing ? { message: missing } : { gesture: "puits" };
  }
  const c = save.cells[target.key];
  if (!c) return { message: "Rien à faire ici" };
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
        // l'eau remontée s'ajoute : un mauvais remplissage ne vide jamais l'arrosoir
        inventory: setWater(
          save.inventory,
          Math.max(waterLeft(save.inventory), 1, Math.round(5 * (result.water ?? 0))),
        ),
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

import { applyToCell, sowCell, standPoint } from "../actions";
import { hasWeed } from "../nuisances";
import { RARITIES } from "../catalog/rarity";
import type { Carry, PotagerSave, Seed, StaffTask, Worker } from "../types";
import { dropCarry, takeSeeds } from "./carry";
import { assignedCells, cellTask, isAssigned, nearest, type Trade } from "./tasks";

type Need = "chasser" | "desherber" | "becher" | "bechee";

// ce que demande une case, dans l'ordre de priorité du jardinier
function need(save: PotagerSave, key: string): Need | null {
  if (save.crows[key]) return "chasser";
  if (hasWeed(save, key)) return "desherber";
  const c = save.cells[key];
  if (c?.kind === "herbe") return "becher";
  if (c?.kind === "bechee") return "bechee";
  return null;
}

const ORDER: Need[] = ["chasser", "desherber", "becher", "bechee"];
const allowed = (save: PotagerSave) => save.staff.jardinier?.maxRarity ?? "commune";
const abri = (gesture: "prendre" | "deposer"): StaffTask => ({
  gesture,
  stand: standPoint({ kind: "abri" }),
});
// la limite peut baisser alors qu'il porte déjà des graines : il ne sème que celles permises
const permitted = (save: PotagerSave, seed: Seed) =>
  RARITIES.indexOf(seed.rarity) <= RARITIES.indexOf(allowed(save));
const sowable = (save: PotagerSave, w: Worker) => w.carry.seeds.filter((x) => permitted(save, x));
const overCap = (save: PotagerSave, w: Worker): Carry => ({
  seeds: w.carry.seeds.filter((x) => !permitted(save, x)),
  flowers: [],
});
// les graines au-dessus de la limite repartent au coffre, s'il a la place
const canReturn = (save: PotagerSave, w: Worker) => {
  const back = overCap(save, w);
  return back.seeds.length > 0 && dropCarry(save, back).save !== save;
};

// Chasse les corneilles, désherbe, bêche puis sème avec les graines du coffre.
export const JARDINIER: Trade = {
  plan(save, id, w) {
    if (canReturn(save, w)) return abri("deposer");
    const cells = assignedCells(save, id);
    for (const n of ORDER) {
      const c = nearest(
        w.pos,
        cells.filter((x) => need(save, x.key) === n),
      );
      if (!c) continue;
      if (n !== "bechee") return cellTask(n, c.key);
      if (sowable(save, w).length) return cellTask("semer", c.key);
      return takeSeeds(save, allowed(save)) ? abri("prendre") : { kind: "noSeeds" };
    }
    return { kind: "idle" };
  },
  check(save, id, w: Worker, task) {
    if (task.gesture === "prendre") return takeSeeds(save, allowed(save)) !== null;
    if (task.gesture === "deposer") return canReturn(save, w);
    if (!isAssigned(save, id, task.cell!)) return false;
    const n = need(save, task.cell!);
    if (task.gesture === "semer") return n === "bechee" && sowable(save, w).length > 0;
    return n === task.gesture;
  },
  act(save, _id, w, task, grade) {
    if (task.gesture === "prendre") {
      const r = takeSeeds(save, allowed(save));
      if (!r) return null;
      return {
        save: r.save,
        worker: { ...w, carry: { ...w.carry, seeds: [...w.carry.seeds, ...r.carry.seeds] } },
      };
    }
    if (task.gesture === "deposer") {
      const back = overCap(save, w);
      const r = dropCarry(save, back);
      const kept = w.carry.seeds.filter((x) => permitted(save, x));
      return {
        save: r.save,
        worker: { ...w, carry: { ...w.carry, seeds: [...kept, ...r.left.seeds] } },
      };
    }
    const key = task.cell!;
    if (task.gesture === "chasser") {
      const crows = { ...save.crows };
      delete crows[key];
      return { save: { ...save, crows }, worker: w };
    }
    if (task.gesture === "semer") {
      const [seed, ...rest] = w.carry.seeds;
      return {
        save: sowCell(save, key, seed, grade),
        worker: { ...w, carry: { ...w.carry, seeds: rest } },
      };
    }
    return {
      save: applyToCell(save, key, task.gesture === "becher" ? "becher" : "desherber", grade),
      worker: w,
    };
  },
};

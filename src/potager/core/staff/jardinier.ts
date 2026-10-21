import { applyToCell, sowCell, standPoint } from "../actions";
import { hasWeed } from "../nuisances";
import type { PotagerSave, StaffTask, Worker } from "../types";
import { takeSeeds } from "./carry";
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
const abri = (): StaffTask => ({ gesture: "prendre", stand: standPoint({ kind: "abri" }) });

// Chasse les corneilles, désherbe, bêche puis sème avec les graines du coffre.
export const JARDINIER: Trade = {
  plan(save, id, w) {
    const cells = assignedCells(save, id);
    for (const n of ORDER) {
      const c = nearest(
        w.pos,
        cells.filter((x) => need(save, x.key) === n),
      );
      if (!c) continue;
      if (n !== "bechee") return cellTask(n, c.key);
      if (w.carry.seeds.length) return cellTask("semer", c.key);
      return takeSeeds(save, allowed(save)) ? abri() : { kind: "noSeeds" };
    }
    return { kind: "idle" };
  },
  check(save, id, w: Worker, task) {
    if (task.gesture === "prendre") return takeSeeds(save, allowed(save)) !== null;
    if (!isAssigned(save, id, task.cell!)) return false;
    const n = need(save, task.cell!);
    if (task.gesture === "semer") return n === "bechee" && w.carry.seeds.length > 0;
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

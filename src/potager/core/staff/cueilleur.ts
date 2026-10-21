import { harvestCell, standPoint } from "../actions";
import { stageOf } from "../growth";
import type { Carry, FlowerStack, PotagerSave } from "../types";
import { dropCarry } from "./carry";
import { CARRY_FLOWERS } from "./catalog";
import { assignedCells, cellTask, isAssigned, nearest, type Trade } from "./tasks";

const held = (c: Carry) => c.flowers.reduce((n, f) => n + f.count, 0);
const isEmpty = (c: Carry) => !c.seeds.length && !c.flowers.length;
const inBloom = (save: PotagerSave, key: string) => {
  const c = save.cells[key];
  return c?.kind === "plante" && stageOf(c.progress) === 4;
};

function addFlower(carry: Carry, f: FlowerStack): Carry {
  const i = carry.flowers.findIndex(
    (x) => x.species === f.species && x.color === f.color && x.quality === f.quality,
  );
  const flowers =
    i < 0
      ? [...carry.flowers, f]
      : carry.flowers.map((x, j) => (j === i ? { ...x, count: x.count + f.count } : x));
  return { ...carry, flowers };
}

// Cueille les fleurs épanouies de ses parcelles et les range au coffre de l'abri.
export const CUEILLEUR: Trade = {
  plan(save, id, w) {
    const c =
      held(w.carry) < CARRY_FLOWERS &&
      nearest(
        w.pos,
        assignedCells(save, id).filter((x) => inBloom(save, x.key)),
      );
    if (c) return cellTask("cueillir", c.key);
    if (isEmpty(w.carry)) return { kind: "idle" };
    // coffre plein : rien ne rentre, il s'arrête et la cueillette attend sur les plantes
    if (dropCarry(save, w.carry).save === save) return { kind: "chestFull" };
    return { gesture: "deposer", stand: standPoint({ kind: "abri" }) };
  },
  check(save, id, w, task) {
    if (task.gesture === "deposer") return true;
    return (
      held(w.carry) < CARRY_FLOWERS && isAssigned(save, id, task.cell!) && inBloom(save, task.cell!)
    );
  },
  act(save, _id, w, task, grade, rng) {
    if (task.gesture === "deposer") {
      const r = dropCarry(save, w.carry);
      return { save: r.save, worker: { ...w, carry: r.left } };
    }
    const h = harvestCell(save, task.cell!, grade, rng, true, false);
    if (!h) return null;
    const carry = addFlower(w.carry, h.flower);
    return {
      save: h.save,
      worker: { ...w, carry: h.seed ? { ...carry, seeds: [...carry.seeds, h.seed] } : carry },
    };
  },
};

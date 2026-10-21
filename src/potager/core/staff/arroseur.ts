import { applyToCell, standPoint } from "../actions";
import type { PotagerSave } from "../types";
import { CAN_SIZE } from "./catalog";
import { assignedCells, cellTask, isAssigned, nearest, type Trade } from "./tasks";

const isDry = (save: PotagerSave, key: string) => {
  const c = save.cells[key];
  return c?.kind === "plante" && c.progress < 1 && c.wetUntil <= save.playTimeMs;
};

// Arrose les plantes sèches de ses parcelles ; arrosoir vide : aller-retour au puits.
export const ARROSEUR: Trade = {
  plan(save, id, w) {
    if (w.water <= 0) return { gesture: "remplir", stand: standPoint({ kind: "puits" }) };
    const c = nearest(
      w.pos,
      assignedCells(save, id).filter((x) => isDry(save, x.key)),
    );
    return c ? cellTask("arroser", c.key) : { kind: "idle" };
  },
  check(save, id, w, task) {
    if (task.gesture === "remplir") return true;
    return w.water > 0 && isAssigned(save, id, task.cell!) && isDry(save, task.cell!);
  },
  act(save, _id, w, task, grade) {
    if (task.gesture === "remplir") return { save, worker: { ...w, water: CAN_SIZE } };
    return {
      save: applyToCell(save, task.cell!, "arroser", grade),
      worker: { ...w, water: w.water - 1 },
    };
  },
};

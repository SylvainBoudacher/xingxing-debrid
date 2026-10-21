import { standPoint } from "../actions";
import { parcelCells, type CellSlot } from "../cells";
import type {
  Grade,
  Point,
  PotagerSave,
  StaffGesture,
  StaffId,
  StaffStatus,
  StaffTask,
  Worker,
} from "../types";

// Un métier : choisir sa prochaine tâche, la revalider, l'appliquer une fois le geste fini.
export interface Trade {
  plan(save: PotagerSave, id: StaffId, w: Worker): StaffTask | StaffStatus;
  check(save: PotagerSave, id: StaffId, w: Worker, task: StaffTask): boolean;
  // null : la tâche ne se prête plus, abandon sans effet
  act(
    save: PotagerSave,
    id: StaffId,
    w: Worker,
    task: StaffTask,
    grade: Grade,
    rng: () => number,
  ): { save: PotagerSave; worker: Worker } | null;
}

// cases des parcelles possédées et confiées à cet employé, sauf celle du mini-jeu du joueur
export function assignedCells(save: PotagerSave, id: StaffId): CellSlot[] {
  const parcels = save.staff[id]?.parcels ?? [];
  return parcels
    .filter((p) => save.parcels.includes(p))
    .flatMap((p) => parcelCells(p))
    .filter((c) => c.key !== save.playerBusy);
}

export const isAssigned = (save: PotagerSave, id: StaffId, key: string) =>
  assignedCells(save, id).some((c) => c.key === key);

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

export function nearest(from: Point, cells: CellSlot[]): CellSlot | null {
  let best: CellSlot | null = null;
  for (const c of cells) if (!best || dist(from, c.center) < dist(from, best.center)) best = c;
  return best;
}

export const cellTask = (gesture: StaffGesture, key: string): StaffTask => ({
  gesture,
  cell: key,
  stand: standPoint({ kind: "cell", key }),
});

export const isTask = (p: StaffTask | StaffStatus): p is StaffTask => "gesture" in p;

export function statusOf(task: StaffTask): StaffStatus {
  if (task.gesture === "remplir") return { kind: "puits" };
  if (task.gesture === "deposer" || task.gesture === "prendre") return { kind: "abri" };
  return { kind: "work", gesture: task.gesture, cell: task.cell ?? "etal" };
}

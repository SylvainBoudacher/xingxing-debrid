import { maisonStand } from "../catalog/map";
import { findPath } from "../path";
import {
  STAFF_IDS,
  type Grade,
  type Point,
  type PotagerSave,
  type StaffId,
  type StaffTask,
  type Worker,
} from "../types";
import { isWalkable } from "../walk";
import { ARROSEUR } from "./arroseur";
import { JARDINIER } from "./jardinier";
import { EMPTY_CARRY } from "./carry";
import { CAN_SIZE } from "./catalog";
import { gestureMs, rollStaffGrade, staffSpeed } from "./grade";
import { isTask, statusOf, type Trade } from "./tasks";

const TRADES: Partial<Record<StaffId, Trade>> = { arroseur: ARROSEUR, jardinier: JARDINIER };
const MAX_TASKS = 20;
const UNGRADED = new Set(["remplir", "chasser", "deposer", "prendre"]);

export const newWorker = (): Worker => ({
  pos: maisonStand(),
  path: [],
  task: null,
  doneAt: null,
  carry: EMPTY_CARRY,
  water: CAN_SIZE,
  status: { kind: "idle" },
});

// le joueur joue un mini-jeu sur cette case (ou à l'étal) : il passe avant
const playerHas = (save: PotagerSave, task: StaffTask) =>
  save.playerBusy !== null &&
  (task.cell === save.playerBusy || (task.gesture === "servir" && save.playerBusy === "etal"));

// avance le long du chemin ; rend le temps consommé (ms)
function walk(w: Worker, speed: number, budgetMs: number): { w: Worker; usedMs: number } {
  let left = (speed * budgetMs) / 1000;
  let pos = w.pos;
  const path = [...w.path];
  while (path.length && left > 0) {
    const to = path[0];
    const d = Math.hypot(to.x - pos.x, to.z - pos.z);
    if (d <= left) {
      pos = to;
      left -= d;
      path.shift();
    } else {
      pos = { x: pos.x + ((to.x - pos.x) / d) * left, z: pos.z + ((to.z - pos.z) / d) * left };
      left = 0;
    }
  }
  return { w: { ...w, pos, path }, usedMs: budgetMs - (left * 1000) / speed };
}

const routeTo = (save: PotagerSave, from: Point, to: Point) =>
  findPath(from, to, (x, z) => isWalkable(x, z, save.buildings));

function advanceOne(
  save: PotagerSave,
  id: StaffId,
  trade: Trade,
  stepMs: number,
  rng: () => number,
) {
  const level = save.staff[id]!.level;
  const speed = staffSpeed(level);
  const stepStart = save.playTimeMs;
  let w = save.crew[id] ?? newWorker();
  let t = stepStart;
  let budget = stepMs;
  let tasks = 0;
  // les gestes sont datés de l'instant où ils ont lieu dans le pas
  const at = (s: PotagerSave) => ({ ...s, playTimeMs: t });
  const drop = () => (w = { ...w, task: null, doneAt: null, path: [] });

  while (budget > 0 && tasks < MAX_TASKS) {
    const task = w.task;
    if (!task) {
      const next = trade.plan(at(save), id, w);
      if (!isTask(next)) {
        // repos : retour à la maison
        if (w.status.kind !== next.kind || !w.path.length)
          w = { ...w, status: next, path: routeTo(save, w.pos, maisonStand()) ?? [] };
        const r = walk(w, speed, budget);
        w = r.w;
        break;
      }
      const path = routeTo(save, w.pos, next.stand);
      // injoignable : rien d'autre à tenter dans ce pas
      if (!path) break;
      w = { ...w, task: next, path, doneAt: null, status: statusOf(next) };
      continue;
    }
    if (playerHas(save, task) || !trade.check(at(save), id, w, task)) {
      drop();
      tasks++;
      continue;
    }
    if (w.doneAt === null) {
      const r = walk(w, speed, budget);
      w = r.w;
      t += r.usedMs;
      budget -= r.usedMs;
      if (w.path.length) break;
      w = { ...w, doneAt: t + gestureMs(level) };
      continue;
    }
    // le geste se termine à un pas suivant
    if (t + budget < w.doneAt) break;
    budget -= w.doneAt - t;
    t = w.doneAt;
    const grade: Grade = UNGRADED.has(task.gesture) ? "bien" : rollStaffGrade(level, rng);
    const out = trade.act(at(save), id, w, task, grade, rng);
    if (out) {
      save = { ...out.save, playTimeMs: stepStart };
      w = out.worker;
    }
    drop();
    tasks++;
  }
  return { ...save, crew: { ...save.crew, [id]: w } };
}

// Fait travailler chaque employé embauché pendant `stepMs` de temps de jeu.
export function advanceStaff(save: PotagerSave, stepMs: number, rng: () => number): PotagerSave {
  for (const id of STAFF_IDS) {
    const trade = TRADES[id];
    if (save.staff[id] && trade) save = advanceOne(save, id, trade, stepMs, rng);
  }
  return save;
}

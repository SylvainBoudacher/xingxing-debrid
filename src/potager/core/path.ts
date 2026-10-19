import { MAP } from "./catalog/map";
import type { Point } from "./types";
import { nearestWalkable, segmentWalkable, type Walkable } from "./walk";

const CELL = 0.5;
const { x0, z0 } = MAP.bounds;
const COLS = Math.round((MAP.bounds.x1 - x0) / CELL) + 1;
const ROWS = Math.round((MAP.bounds.z1 - z0) / CELL) + 1;

const nodeX = (i: number) => x0 + (i % COLS) * CELL;
const nodeZ = (i: number) => z0 + Math.floor(i / COLS) * CELL;

// nœud praticable le plus proche parmi les quatre coins de la cellule et leurs voisins
function snap(p: Point, walkable: Walkable): number | null {
  const ci = Math.round((p.x - x0) / CELL),
    cj = Math.round((p.z - z0) / CELL);
  let best: number | null = null,
    bestD = Infinity;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const i = ci + di,
        j = cj + dj;
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS) continue;
      const n = j * COLS + i;
      const d = Math.hypot(nodeX(n) - p.x, nodeZ(n) - p.z);
      if (
        d < bestD &&
        walkable(nodeX(n), nodeZ(n)) &&
        segmentWalkable(p, { x: nodeX(n), z: nodeZ(n) }, walkable)
      ) {
        best = n;
        bestD = d;
      }
    }
  return best;
}

const octile = (a: number, b: number) => {
  const dx = Math.abs(nodeX(a) - nodeX(b)),
    dz = Math.abs(nodeZ(a) - nodeZ(b));
  return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
};

function astar(start: number, goal: number, walkable: Walkable): number[] | null {
  const open = new Map<number, number>([[start, octile(start, goal)]]);
  const g = new Map<number, number>([[start, 0]]);
  const came = new Map<number, number>();
  const closed = new Set<number>();
  const free = (i: number, j: number) =>
    i >= 0 && j >= 0 && i < COLS && j < ROWS && walkable(x0 + i * CELL, z0 + j * CELL);

  while (open.size) {
    let cur = -1,
      curF = Infinity;
    for (const [n, f] of open) if (f < curF) [cur, curF] = [n, f];
    if (cur === goal) {
      const path = [cur];
      while (came.has(path[0])) path.unshift(came.get(path[0])!);
      return path;
    }
    open.delete(cur);
    closed.add(cur);
    const ci = cur % COLS,
      cj = Math.floor(cur / COLS);
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const i = ci + di,
          j = cj + dj;
        if (!free(i, j)) continue;
        // pas de coin coupé
        if (di && dj && (!free(ci + di, cj) || !free(ci, cj + dj))) continue;
        const n = j * COLS + i;
        if (closed.has(n)) continue;
        const cost = g.get(cur)! + (di && dj ? Math.SQRT2 : 1) * CELL;
        if (cost >= (g.get(n) ?? Infinity)) continue;
        g.set(n, cost);
        came.set(n, cur);
        open.set(n, cost + octile(n, goal));
      }
  }
  return null;
}

export function findPath(from: Point, to: Point, walkable: Walkable): Point[] | null {
  const target = nearestWalkable(to, walkable);
  if (!target) return null;
  if (Math.hypot(target.x - from.x, target.z - from.z) < 1e-6) return [];
  if (segmentWalkable(from, target, walkable)) return [target];
  const start = snap(from, walkable),
    goal = snap(target, walkable);
  if (start === null || goal === null) return null;
  const nodes = astar(start, goal, walkable);
  if (!nodes) return null;

  const points = [from, ...nodes.map((n) => ({ x: nodeX(n), z: nodeZ(n) })), target];
  // lissage : on saute les points intermédiaires tant que la ligne droite reste praticable
  const out: Point[] = [];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let next = points.length - 1;
    while (next > anchor + 1 && !segmentWalkable(points[anchor], points[next], walkable)) next--;
    out.push(points[next]);
    anchor = next;
  }
  return out;
}

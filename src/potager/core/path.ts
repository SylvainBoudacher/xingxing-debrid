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

// tas binaire minimal sur f ; les entrées périmées sont ignorées à la sortie
function createHeap() {
  const items: [number, number][] = [];
  return {
    get size() {
      return items.length;
    },
    push(node: number, f: number) {
      items.push([node, f]);
      let i = items.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (items[p][1] <= items[i][1]) break;
        [items[p], items[i]] = [items[i], items[p]];
        i = p;
      }
    },
    pop(): [number, number] {
      const top = items[0];
      const last = items.pop()!;
      if (items.length) {
        items[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1,
            r = l + 1;
          let m = i;
          if (l < items.length && items[l][1] < items[m][1]) m = l;
          if (r < items.length && items[r][1] < items[m][1]) m = r;
          if (m === i) break;
          [items[m], items[i]] = [items[i], items[m]];
          i = m;
        }
      }
      return top;
    },
  };
}

function astar(start: number, goal: number, walkable: Walkable): number[] | null {
  const open = createHeap();
  open.push(start, octile(start, goal));
  const g = new Float64Array(COLS * ROWS).fill(Infinity);
  g[start] = 0;
  const came = new Int32Array(COLS * ROWS).fill(-1);
  const closed = new Uint8Array(COLS * ROWS);
  // 0 : inconnu, 1 : praticable, 2 : bloqué
  const cache = new Uint8Array(COLS * ROWS);
  const free = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return false;
    const n = j * COLS + i;
    if (!cache[n]) cache[n] = walkable(x0 + i * CELL, z0 + j * CELL) ? 1 : 2;
    return cache[n] === 1;
  };

  while (open.size) {
    const [cur] = open.pop();
    if (closed[cur]) continue;
    if (cur === goal) {
      const path = [cur];
      while (came[path[0]] !== -1) path.unshift(came[path[0]]);
      return path;
    }
    closed[cur] = 1;
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
        if (closed[n]) continue;
        const cost = g[cur] + (di && dj ? Math.SQRT2 : 1) * CELL;
        if (cost >= g[n]) continue;
        g[n] = cost;
        came[n] = cur;
        open.push(n, cost + octile(n, goal));
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

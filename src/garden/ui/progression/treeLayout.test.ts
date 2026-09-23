import { describe, expect, it } from "vitest";
import { nodeById, TREE, type TreeNode } from "../../core/catalog/tree";
import { vinePointAt, type Point } from "./vines";

const STEPS = 40;
// rayon d'un nœud dans l'espace 1000 x 640, avec une petite marge
const CLEARANCE = 40;

const vines = TREE.filter((n) => n.parent).map((n) => {
  const from = nodeById(n.parent!)!;
  return {
    id: `${from.id} -> ${n.id}`,
    ends: [from, n] as TreeNode[],
    pts: Array.from({ length: STEPS + 1 }, (_, i) => vinePointAt(from, n, i / STEPS)),
  };
});

const cross = (a: Point, b: Point, c: Point, d: Point) => {
  const side = (p: Point, q: Point, r: Point) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
};

describe("disposition de l'arbre", () => {
  it("aucune liane ne passe sur un autre palier", () => {
    const hits = vines.flatMap((v) =>
      TREE.filter(
        (n) =>
          !v.ends.includes(n) && v.pts.some((p) => Math.hypot(p.x - n.x, p.y - n.y) < CLEARANCE),
      ).map((n) => `${v.id} passe sur ${n.id}`),
    );
    expect(hits).toEqual([]);
  });

  it("les lianes ne se croisent pas", () => {
    const hits: string[] = [];
    vines.forEach((a, i) =>
      vines.slice(i + 1).forEach((b) => {
        // les lianes sœurs partent du même point : on ignore leur départ commun
        const crossed = a.pts
          .slice(2, -1)
          .some((p, x) =>
            b.pts.slice(2, -1).some((q, y) => cross(p, a.pts[x + 3], q, b.pts[y + 3])),
          );
        if (crossed) hits.push(`${a.id} croise ${b.id}`);
      }),
    );
    expect(hits).toEqual([]);
  });
});

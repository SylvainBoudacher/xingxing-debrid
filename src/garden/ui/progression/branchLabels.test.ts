import { describe, expect, it } from "vitest";
import type { TreeNode } from "../../core/catalog/tree";
import { branchLabels } from "./branchLabels";

const node = (id: string, branch: TreeNode["branch"], x: number, y: number) =>
  ({ id, branch, x, y }) as TreeNode;

describe("branchLabels", () => {
  it("place chaque nom de branche au-dessus de son palier le plus haut", () => {
    const labels = branchLabels([
      node("a", "jardin", 300, 400),
      node("b", "jardin", 200, 150),
      node("c", "decor", 600, 300),
    ]);
    expect(labels).toEqual([
      { branch: "jardin", x: 200, y: 95 },
      { branch: "decor", x: 600, y: 245 },
    ]);
  });

  it("ne sort jamais du haut de l'arbre", () => {
    expect(branchLabels([node("a", "collection", 300, 40)])[0].y).toBe(14);
  });
});

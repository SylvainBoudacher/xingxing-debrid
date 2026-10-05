import type { BranchId, TreeNode } from "../../core/catalog/tree";

// Palier le plus haut de chaque branche : son nom s'affiche juste au-dessus. L'écart est
// en pixels (voir TreeView), pas en unités de l'arbre, pour ne pas fondre en petite fenêtre.
export function branchLabels(nodes: TreeNode[]): { branch: BranchId; x: number; y: number }[] {
  const highest = new Map<BranchId, TreeNode>();
  for (const n of nodes) {
    const best = highest.get(n.branch);
    if (!best || n.y < best.y) highest.set(n.branch, n);
  }
  return [...highest.values()].map((n) => ({ branch: n.branch, x: n.x, y: n.y }));
}

import type { BranchId, TreeNode } from "../../core/catalog/tree";

const ABOVE = 55;
const TOP = 14;

export function branchLabels(nodes: TreeNode[]): { branch: BranchId; x: number; y: number }[] {
  const highest = new Map<BranchId, TreeNode>();
  for (const n of nodes) {
    const best = highest.get(n.branch);
    if (!best || n.y < best.y) highest.set(n.branch, n);
  }
  return [...highest.values()].map((n) => ({
    branch: n.branch,
    x: n.x,
    y: Math.max(TOP, n.y - ABOVE),
  }));
}

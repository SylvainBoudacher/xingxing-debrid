import { describe, expect, it } from "vitest";
import { DECOR_DRAW } from "../../sprites/decor";
import { SPECIES_DRAW } from "../../sprites/species";
import { STAGE_DRAW } from "../../sprites/stages";
import { TOOL_DRAW } from "../../sprites/tools";
import { DECOR_FR, RARITY_FR } from "../labels";
import { PLOTS } from "../plots";
import { BRANCHES, nodeById, TREE, type TreeNode } from "./tree";
import { isSpeciesId } from "./species";

const SPRITES = new Set([
  ...Object.keys(SPECIES_DRAW),
  ...Object.keys(STAGE_DRAW),
  ...Object.keys(DECOR_DRAW),
  ...Object.keys(TOOL_DRAW),
  "arbre",
]);

describe("catalogue de l'arbre", () => {
  it("compte 17 nœuds aux identifiants uniques", () => {
    expect(TREE).toHaveLength(17);
    expect(new Set(TREE.map((n) => n.id)).size).toBe(17);
  });

  it("a une seule racine et des parents qui existent", () => {
    expect(TREE.filter((n) => !n.parent)).toHaveLength(1);
    for (const n of TREE) if (n.parent) expect(nodeById(n.parent)).toBeDefined();
  });

  it("remonte toujours à la racine sans cycle", () => {
    for (const n of TREE) {
      let cur: TreeNode | undefined = n;
      let steps = 0;
      while (cur?.parent) {
        cur = nodeById(cur.parent);
        expect(++steps).toBeLessThanOrEqual(TREE.length);
      }
      expect(cur?.id).toBe("root");
    }
  });

  it("range chaque nœud dans une branche connue", () => {
    for (const n of TREE) expect(BRANCHES[n.branch]).toBeDefined();
  });

  it("ne cite que des récompenses qui existent", () => {
    for (const { reward } of TREE) {
      if (reward.kind === "parcelle") expect(PLOTS[reward.plot]).toBeDefined();
      if (reward.kind === "decor") {
        expect(DECOR_FR[reward.decor]).toBeDefined();
        expect(reward.count).toBeGreaterThan(0);
      }
      if (reward.kind === "graines") {
        expect(RARITY_FR[reward.rarity]).toBeDefined();
        expect(reward.count).toBeGreaterThan(0);
      }
    }
  });

  it("ne demande que des espèces du catalogue dans les paniers", () => {
    for (const { task } of TREE) {
      if (task.kind !== "panier") continue;
      expect(task.items.length).toBeGreaterThan(0);
      for (const { species, count } of task.items) {
        expect(isSpeciesId(species)).toBe(true);
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  it("vise une cible atteignable pour les autres tâches", () => {
    for (const { task } of TREE) {
      if (task.kind === "panier") continue;
      expect(task.target).toBeGreaterThan(0);
    }
  });

  it("place les nœuds dans l'espace 1000 x 640 et n'utilise que des sprites connus", () => {
    for (const n of TREE) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(1000);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(640);
      expect(SPRITES.has(n.icon.name)).toBe(true);
    }
  });

  it("dessine la racine en bas et les feuilles en haut", () => {
    const root = nodeById("root")!;
    for (const n of TREE) if (n.id !== "root") expect(n.y).toBeLessThan(root.y);
  });
});

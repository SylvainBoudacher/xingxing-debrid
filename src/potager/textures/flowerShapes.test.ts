import { describe, expect, it } from "vitest";
import { COLORS } from "../core/catalog/colors";
import { CATALOG_ENTRIES, SPECIES } from "../core/catalog/species";
import { COLOR_HEX, FLOWER_SHAPES, silhouetteGrid, STAGE_SHAPES } from "./flowerShapes";

const filled = (g: string[]) =>
  g.flatMap((row, y) => [...row].map((ch, x) => (ch !== "." ? `${x},${y}` : null))).filter(Boolean);

describe("formes des fleurs", () => {
  it("dessine chaque espèce sur une grille de 16 x 24", () => {
    for (const s of SPECIES) {
      const g = FLOWER_SHAPES[s.id];
      expect(g, s.id).toHaveLength(24);
      for (const row of g) expect(row, s.id).toHaveLength(16);
    }
  });

  it("donne à chaque espèce une silhouette bien à elle", () => {
    const ids = SPECIES.map((s) => s.id);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = new Set(filled(FLOWER_SHAPES[ids[i]])),
          b = new Set(filled(FLOWER_SHAPES[ids[j]]));
        const diff =
          [...a].filter((p) => !b.has(p)).length + [...b].filter((p) => !a.has(p)).length;
        expect(diff, `${ids[i]} / ${ids[j]}`).toBeGreaterThanOrEqual(20);
      }
  });

  it("colore toutes les couleurs du catalogue", () => {
    for (const e of CATALOG_ENTRIES) expect(COLOR_HEX[e.color], e.color).toBeDefined();
    expect(Object.keys(COLOR_HEX).sort()).toEqual(Object.keys(COLORS).sort());
  });

  it("dessine les 4 étapes de pousse, identiques pour toutes les espèces", () => {
    expect(STAGE_SHAPES).toHaveLength(4);
    for (const g of STAGE_SHAPES) expect(g).toHaveLength(24);
  });

  it("réduit une espèce à sa silhouette d'une seule teinte", () => {
    const g = silhouetteGrid("tournesol");
    const src = FLOWER_SHAPES.tournesol;
    g.forEach((row, y) =>
      [...row].forEach((ch, x) => expect(ch).toBe(src[y][x] === "." ? "." : "x")),
    );
  });
});

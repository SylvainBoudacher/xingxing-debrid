import { describe, expect, it } from "vitest";
import { COLOR_RAMP } from "../../sprites/colorRamps";
import { PAL } from "../../sprites/palette";
import { SPECIES_DRAW } from "../../sprites/species/index";
import { COLORS } from "./colors";
import { CATALOG_ENTRIES, harvestTool, isSpeciesId, rarityOf, SPECIES, speciesOf } from "./species";

describe("catalogue", () => {
  it("65 entrées, 26 / 18 / 11 / 10", () => {
    expect(CATALOG_ENTRIES).toHaveLength(65);
    const count = (r: string) => CATALOG_ENTRIES.filter((e) => e.rarity === r).length;
    expect([count("commune"), count("rare"), count("epique"), count("legendaire")]).toEqual([
      26, 18, 11, 10,
    ]);
  });

  it("14 espèces, chacune avec des couleurs sans doublon, un dessin et une note", () => {
    expect(SPECIES).toHaveLength(14);
    for (const s of SPECIES) {
      const colors = s.colors.map((c) => c.color);
      expect(colors.length).toBeGreaterThan(0);
      expect(new Set(colors).size).toBe(colors.length);
      expect(SPECIES_DRAW[s.id]).toBeTypeOf("function");
      expect(s.note.length).toBeGreaterThan(20);
    }
  });

  it("chaque couleur a ses noms et sa gamme", () => {
    for (const id of Object.keys(COLORS) as (keyof typeof COLORS)[]) {
      expect(COLORS[id]).toHaveLength(2);
      expect(PAL[COLOR_RAMP[id]]).toHaveLength(4);
    }
  });

  it("la Lanterne-de-lune est entièrement légendaire", () => {
    expect(speciesOf("lanternelune").colors.every((c) => c.rarity === "legendaire")).toBe(true);
  });

  it("outils, raretés et garde d'identifiant", () => {
    expect(harvestTool("dahlia")).toBe("secateur");
    expect(harvestTool("anemone")).toBe("main");
    expect(rarityOf("dahlia", "blue")).toBe("legendaire");
    expect(rarityOf("dahlia", "lilac")).toBeNull();
    expect(isSpeciesId("sedum")).toBe(true);
    expect(isSpeciesId("pissenlit")).toBe(false);
  });
});

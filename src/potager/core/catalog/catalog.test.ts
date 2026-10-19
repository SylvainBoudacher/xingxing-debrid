import { describe, expect, it } from "vitest";
import { COLORS } from "./colors";
import { CATALOG_ENTRIES, SPECIES } from "./species";

describe("catalogue des fleurs", () => {
  it("compte 14 espèces et 65 entrées", () => {
    expect(SPECIES).toHaveLength(14);
    expect(CATALOG_ENTRIES).toHaveLength(65);
  });

  it("a des identifiants d'espèces uniques", () => {
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
  });

  it("n'utilise que des couleurs connues", () => {
    for (const e of CATALOG_ENTRIES) expect(COLORS).toHaveProperty(e.color);
  });

  it("couvre les 4 raretés", () => {
    expect(new Set(CATALOG_ENTRIES.map((e) => e.rarity))).toEqual(
      new Set(["commune", "rare", "epique", "legendaire"]),
    );
  });

  it("ne donne que des Lanternes-de-lune légendaires", () => {
    const lanternes = CATALOG_ENTRIES.filter((e) => e.species === "lanternelune");
    expect(lanternes.length).toBeGreaterThan(0);
    expect(lanternes.every((e) => e.rarity === "legendaire")).toBe(true);
  });
});

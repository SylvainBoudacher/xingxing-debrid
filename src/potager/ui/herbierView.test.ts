import { describe, expect, it } from "vitest";
import { CATALOG_ENTRIES } from "../core/catalog/species";
import { advanceGarden, markSeen } from "../core/growth";
import { createStarterSave } from "../core/save";
import { herbierView } from "./herbierView";

describe("vue de l'Herbier", () => {
  it("ne révèle rien d'une entrée non découverte", () => {
    const v = herbierView(createStarterSave());
    expect(v.total).toBe(CATALOG_ENTRIES.length);
    expect(v.found).toBe(0);
    const hidden = JSON.stringify(v.entries[0]);
    expect(hidden).not.toContain(CATALOG_ENTRIES[0].species);
    expect(hidden).not.toContain(`"${CATALOG_ENTRIES[0].color}"`);
  });

  it("garde une fleur éclose cachée tant qu'elle n'a pas été montrée", () => {
    const s = createStarterSave();
    const v = herbierView({
      ...s,
      herbier: { "tournesol:yellow": { discoveredAt: 0, announced: false } },
    });
    expect(v.found).toBe(0);
  });

  it("montre une fleur une fois éclose et annoncée", () => {
    const s = createStarterSave();
    const key = Object.keys(s.cells)[0];
    const bloomed = advanceGarden(
      {
        ...s,
        cells: {
          ...s.cells,
          [key]: {
            kind: "plante",
            seed: { rarity: "commune", species: "tournesol", color: "yellow" },
            progress: 0.99,
            loose: false,
            sowGrade: "rate",
            wetUntil: 0,
            wetGrade: "rate",
            seen: true,
          },
        },
      },
      60_000,
    );
    const v = herbierView(markSeen(bloomed, key).save);
    expect(v.found).toBe(1);
    expect(v.entries.find((e) => e.found)).toMatchObject({ found: true, name: "Tournesol jaune" });
  });
});

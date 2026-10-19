import { describe, expect, it } from "vitest";
import { createStarterSave } from "../core/save";
import type { Cell, PotagerSave } from "../core/types";
import { gardenKey } from "./gardenKey";

const plant = (extra: Partial<Extract<Cell, { kind: "plante" }>> = {}): Cell => ({
  kind: "plante",
  seed: { rarity: "commune", species: "tournesol", color: "yellow" },
  progress: 0.05,
  loose: false,
  sowGrade: "rate",
  wetUntil: 0,
  wetGrade: "rate",
  seen: true,
  ...extra,
});

function withCell(c: Cell, playTimeMs = 1000): PotagerSave {
  const s = createStarterSave();
  const key = Object.keys(s.cells)[0];
  return { ...s, playTimeMs, cells: { ...s.cells, [key]: c } };
}

describe("clé visuelle du jardin", () => {
  it("ne change pas quand la plante avance dans la même étape", () => {
    expect(gardenKey(withCell(plant({ progress: 0.05 })))).toBe(
      gardenKey(withCell(plant({ progress: 0.2 }))),
    );
  });

  it("change à l'étape suivante, à l'humidité et à l'éclosion", () => {
    const base = gardenKey(withCell(plant()));
    expect(gardenKey(withCell(plant({ progress: 0.3 })))).not.toBe(base);
    expect(gardenKey(withCell(plant({ wetUntil: 5000 })))).not.toBe(base);
    expect(gardenKey(withCell(plant({ progress: 1 })))).not.toBe(
      gardenKey(withCell(plant({ progress: 0.9 }))),
    );
  });

  it("ne révèle pas l'espèce d'une graine qui pousse", () => {
    const other = plant({ seed: { rarity: "commune", species: "cosmos", color: "pink" } });
    expect(gardenKey(withCell(other))).toBe(gardenKey(withCell(plant())));
  });
});

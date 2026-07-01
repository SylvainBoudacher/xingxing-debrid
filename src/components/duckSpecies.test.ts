import { describe, it, expect } from "vitest";
import { getRarity, randomVariant } from "./duckRandom";
import { SPECIES, speciesOf } from "./duckSpecies";

const BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

describe("speciesOf", () => {
  it("catalog has 33 unique species", () => {
    expect(SPECIES.length).toBe(33);
    expect(BY_ID.size).toBe(33);
  });

  it("every generated variant maps to a cataloged species of the same rarity", () => {
    for (let i = 0; i < 5000; i++) {
      const v = randomVariant();
      const s = BY_ID.get(speciesOf(v));
      expect(s).toBeDefined();
      expect(s!.rarity).toBe(getRarity(v));
    }
  });

  it("each catalog preview maps back to its own species", () => {
    for (const s of SPECIES) expect(speciesOf(s.preview)).toBe(s.id);
  });
});

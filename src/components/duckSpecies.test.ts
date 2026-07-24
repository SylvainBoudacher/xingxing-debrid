import { describe, it, expect } from "vitest";
import { getRarity, randomVariant } from "./duckRandom";
import { SPECIES, speciesOf, variantForSpecies } from "./duckSpecies";
import type { Variant } from "./duckTypes";

const BY_ID = new Map(SPECIES.map((s) => [s.id, s]));
const BEAK = "#F5811F";

describe("speciesOf", () => {
  it("catalog has 42 unique species", () => {
    expect(SPECIES.length).toBe(42);
    expect(BY_ID.size).toBe(42);
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

  it("splits the cape between vampire and superhero by body color", () => {
    const vampire: Variant = {
      body: "#300010",
      beak: BEAK,
      acc: "cape",
      accColor: "#1A0008",
      effect: "glow",
    };
    const hero: Variant = { body: "#FFD21E", beak: BEAK, acc: "cape", accColor: "#E0457B" };
    expect(speciesOf(vampire)).toBe("vampire");
    expect(getRarity(vampire)).toBe("rare");
    expect(speciesOf(hero)).toBe("superhero");
    expect(getRarity(hero)).toBe("uncommon");
  });

  it("splits the snorkel between surfer (teal) and plongeur", () => {
    const surfer: Variant = { body: "#3FD0C8", beak: BEAK, acc: "snorkel", effect: "bubbles" };
    const diver: Variant = { body: "#FFD21E", beak: BEAK, acc: "snorkel", effect: "bubbles" };
    expect(speciesOf(surfer)).toBe("surfer");
    expect(speciesOf(diver)).toBe("snorkel");
    expect(getRarity(surfer)).toBe("rare");
  });

  it("recognizes charcoal shades as the ninja, other bodies as canard cool", () => {
    const ninja: Variant = { body: "#4A5568", beak: BEAK, acc: "shades" };
    const cool: Variant = { body: "#FFD21E", beak: BEAK, acc: "shades" };
    expect(speciesOf(ninja)).toBe("ninja");
    expect(getRarity(ninja)).toBe("uncommon");
    expect(speciesOf(cool)).toBe("shades");
    expect(getRarity(cool)).toBe("common");
  });

  it("maps the new effect and pattern species", () => {
    const infernal: Variant = { body: "#FF3D00", beak: BEAK, acc: "devil", effect: "fire" };
    const glacial: Variant = { body: "#B8E0FF", beak: "#8DB5D0", acc: "none", effect: "frost" };
    const abyssal: Variant = {
      body: "#050F1E",
      beak: "#1A3A5A",
      acc: "none",
      pattern: "abyss",
      effect: "bubbles",
    };
    expect(speciesOf(infernal)).toBe("infernal");
    expect(getRarity(infernal)).toBe("legendary");
    expect(speciesOf(glacial)).toBe("glacial");
    expect(getRarity(glacial)).toBe("rare");
    expect(speciesOf(abyssal)).toBe("abyssal");
    expect(getRarity(abyssal)).toBe("legendary");
  });

  it("maps mustache and feather accessories to their species", () => {
    const mustache: Variant = { body: "#FFD21E", beak: BEAK, acc: "mustache" };
    const chamane: Variant = { body: "#FFD21E", beak: BEAK, acc: "feather" };
    expect(speciesOf(mustache)).toBe("mustache");
    expect(getRarity(mustache)).toBe("common");
    expect(speciesOf(chamane)).toBe("chamane");
    expect(getRarity(chamane)).toBe("rare");
  });
});

describe("variantForSpecies", () => {
  it("always builds a duck of the requested species and rarity", () => {
    for (const s of SPECIES) {
      for (let i = 0; i < 200; i++) {
        const v = variantForSpecies(s);
        expect(speciesOf(v)).toBe(s.id);
        expect(getRarity(v)).toBe(s.rarity);
      }
    }
  });

  it("can reach exactly maxColors distinct bodies, never more", () => {
    for (const s of SPECIES) {
      const seen = new Set<string>();
      for (let i = 0; i < 2000; i++) seen.add(variantForSpecies(s).body);
      expect(seen.size).toBe(s.maxColors);
    }
  });

  it("avoids body colors the player already collected", () => {
    const cool = SPECIES.find((s) => s.id === "shades")!;
    const taken: string[] = [];
    for (let i = 0; i < cool.maxColors - 1; i++) {
      const v = variantForSpecies(cool, taken);
      expect(taken).not.toContain(v.body.toLowerCase());
      taken.push(v.body.toLowerCase());
    }
  });

  it("falls back to any legal color once the family is complete", () => {
    const cool = SPECIES.find((s) => s.id === "shades")!;
    const all = new Set<string>();
    for (let i = 0; i < 500; i++) all.add(variantForSpecies(cool).body.toLowerCase());
    const v = variantForSpecies(cool, [...all]);
    expect(all.has(v.body.toLowerCase())).toBe(true);
    expect(speciesOf(v)).toBe("shades");
  });

  it("leaves fixed-body recipes untouched", () => {
    for (const s of SPECIES.filter((s) => s.maxColors === 1)) {
      expect(variantForSpecies(s).body).toBe(s.preview.body);
    }
  });
});

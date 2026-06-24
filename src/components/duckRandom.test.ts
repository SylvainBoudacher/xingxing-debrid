import { describe, it, expect } from "vitest";
import { randomVariant } from "./duckRandom";
import type { Accessory, Pattern, Effect } from "./duckTypes";

// Accessories that render with v.accColor (mirrors COLORED_ACC in duckRandom.ts)
const COLORED_ACC = new Set<Accessory>([
  "crown",
  "party",
  "tophat",
  "sunhat",
  "flower",
  "bowtie",
  "headphones",
  "beanie",
  "wizard",
  "cowboy",
  "propeller",
  "scarf",
  "monocle",
]);

const VALID_PATTERNS = new Set<Pattern>([
  "spots",
  "stripes",
  "polka",
  "rainbow",
  "gold",
  "galaxy",
  "zombie",
  "metal",
]);
const VALID_EFFECTS = new Set<Effect>(["glow", "ghost", "sparkle", "bubbles"]);
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

// Patterns that can only come from the LEGENDARY tier
const LEGENDARY_PATTERNS = new Set<Pattern>(["rainbow", "gold", "galaxy", "zombie", "metal"]);

describe("randomVariant", () => {
  it("always returns body, beak, and acc as strings", () => {
    for (let i = 0; i < 200; i++) {
      const v = randomVariant();
      expect(typeof v.body).toBe("string");
      expect(typeof v.beak).toBe("string");
      expect(typeof v.acc).toBe("string");
    }
  });

  it("body and beak are always hex color strings", () => {
    for (let i = 0; i < 200; i++) {
      const v = randomVariant();
      expect(v.body).toMatch(HEX_RE);
      expect(v.beak).toMatch(HEX_RE);
    }
  });

  it("pattern is always a valid Pattern type when set", () => {
    for (let i = 0; i < 500; i++) {
      const v = randomVariant();
      if (v.pattern !== undefined) expect(VALID_PATTERNS.has(v.pattern)).toBe(true);
    }
  });

  it("effect is always a valid Effect type when set", () => {
    for (let i = 0; i < 500; i++) {
      const v = randomVariant();
      if (v.effect !== undefined) expect(VALID_EFFECTS.has(v.effect)).toBe(true);
    }
  });

  it("colored accessories always carry accColor", () => {
    for (let i = 0; i < 2000; i++) {
      const v = randomVariant();
      if (COLORED_ACC.has(v.acc)) {
        expect(v.accColor).toBeDefined();
        expect(v.accColor).toMatch(HEX_RE);
      }
    }
  });

  it("legendary variants spawn at roughly 3% (1-8% tolerance over 3000 draws)", () => {
    const N = 3000;
    let count = 0;
    for (let i = 0; i < N; i++) {
      const v = randomVariant();
      if (LEGENDARY_PATTERNS.has(v.pattern as Pattern) || v.effect === "ghost") count++;
    }
    expect(count / N).toBeGreaterThan(0.01);
    expect(count / N).toBeLessThan(0.08);
  });

  it("common variants (no pattern, no effect) are the majority", () => {
    const N = 2000;
    let plain = 0;
    for (let i = 0; i < N; i++) {
      const v = randomVariant();
      if (v.pattern === undefined && v.effect === undefined) plain++;
    }
    // ~60% common + some uncommon accessories with no pattern/effect = well above 50%
    expect(plain / N).toBeGreaterThan(0.5);
  });
});

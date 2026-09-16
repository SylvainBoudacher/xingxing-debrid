import { describe, expect, it } from "vitest";
import { PAL } from "./palette";
import { buf, put } from "./raster";
import { VARIANT_FX } from "./variants";

function sample() {
  const b = buf(3, 3);
  put(b, 1, 0, PAL.pink[2]);
  put(b, 1, 1, PAL.pink[1]);
  put(b, 1, 2, PAL.green[1]);
  return b;
}

describe("VARIANT_FX", () => {
  it("conserve la transparence", () => {
    for (const fx of Object.values(VARIANT_FX)) {
      const b = sample();
      fx(b);
      expect(b.c.map((c) => c !== null)).toEqual(sample().c.map((c) => c !== null));
    }
  });

  it("givrée blanchit le haut des formes et refroidit le reste", () => {
    const b = sample();
    VARIANT_FX.givree(b);
    expect(b.c[1]).toBe("#f0faff");
    expect(b.c[4]).not.toBe(PAL.pink[1]);
  });

  it("dorée garde les feuilles et dore les pétales", () => {
    const b = sample();
    VARIANT_FX.doree(b);
    expect(b.c[7]).toBe(PAL.green[1]);
    expect(b.c[4]).not.toBe(PAL.pink[1]);
  });

  it("lumineuse change toutes les couleurs", () => {
    const b = sample();
    VARIANT_FX.lumineuse(b);
    expect(b.c[4]).not.toBe(PAL.pink[1]);
    expect(b.c[7]).not.toBe(PAL.green[1]);
  });
});

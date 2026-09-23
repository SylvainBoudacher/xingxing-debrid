import { describe, expect, it } from "vitest";
import type { Rarity } from "../core/types";
import { seedBuf } from "./seed";

const RARITIES: Rarity[] = ["commune", "rare", "epique", "legendaire"];
const opaque = (b: { c: (string | null)[] }) => b.c.filter(Boolean).length;

describe("seedBuf", () => {
  it("dessine une graine au format des cartes, différente pour chaque rareté", () => {
    const bufs = RARITIES.map(seedBuf);
    for (const b of bufs) {
      expect([b.w, b.h]).toEqual([48, 72]);
      expect(opaque(b)).toBeGreaterThan(500);
    }
    for (let i = 0; i < bufs.length; i++)
      for (let j = i + 1; j < bufs.length; j++) expect(bufs[i].c).not.toEqual(bufs[j].c);
  });
});

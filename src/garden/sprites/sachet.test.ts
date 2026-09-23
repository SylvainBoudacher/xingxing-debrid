import { describe, expect, it } from "vitest";
import type { SachetType } from "../core/types";
import { PAL } from "./palette";
import { SACHET_H, SACHET_W, sachetBuf, TEAR_ROW } from "./sachet";

const TYPES: SachetType[] = ["quotidien", "dore", "famille"];
const opaque = (b: { c: (string | null)[] }) => b.c.filter(Boolean).length;

describe("sachetBuf", () => {
  it("dessine trois sachets de même taille, tous différents", () => {
    const bufs = TYPES.map(sachetBuf);
    for (const b of bufs) {
      expect([b.w, b.h]).toEqual([SACHET_W, SACHET_H]);
      expect(opaque(b)).toBeGreaterThan(900);
    }
    expect(bufs[0].c).not.toEqual(bufs[1].c);
    expect(bufs[0].c).not.toEqual(bufs[2].c);
    expect(bufs[1].c).not.toEqual(bufs[2].c);
  });

  it("la ligne de déchirure est en pointillés sur TEAR_ROW", () => {
    const b = sachetBuf("quotidien");
    const row = b.c.slice(TEAR_ROW * b.w, (TEAR_ROW + 1) * b.w);
    expect(row.filter((c) => c === PAL.hay[0]).length).toBeGreaterThan(10);
  });
});

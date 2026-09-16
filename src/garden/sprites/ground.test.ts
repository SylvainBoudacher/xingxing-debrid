import { describe, expect, it } from "vitest";
import { HOLE_SIZE, holeBuf } from "./ground";

describe("holeBuf", () => {
  it("trou rond, centré et symétrique", () => {
    const b = holeBuf();
    expect([b.w, b.h]).toEqual([HOLE_SIZE, HOLE_SIZE]);
    const solid = (x: number, y: number) => b.c[y * b.w + x] !== null;
    for (let y = 0; y < b.h; y++)
      for (let x = 0; x < b.w; x++) {
        expect(solid(x, y)).toBe(solid(b.w - 1 - x, y));
        expect(solid(x, y)).toBe(solid(y, x));
      }
    const mid = HOLE_SIZE / 2;
    expect(solid(mid, mid)).toBe(true);
    expect(solid(0, 0)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { PAL } from "./palette";
import { HOLE_SIZE, holeBuf } from "./ground";

describe("holeBuf", () => {
  const b = holeBuf();
  const at = (x: number, y: number) => b.c[y * b.w + x];

  it("tient dans sa tuile sans toucher les coins", () => {
    expect([b.w, b.h]).toEqual([HOLE_SIZE, HOLE_SIZE]);
    for (const [x, y] of [
      [0, 0],
      [HOLE_SIZE - 1, 0],
      [0, HOLE_SIZE - 1],
      [HOLE_SIZE - 1, HOLE_SIZE - 1],
    ])
      expect(at(x, y)).toBeNull();
  });

  it("un creux sombre près du centre et un tas de terre en haut à droite", () => {
    const mid = HOLE_SIZE / 2;
    expect(PAL.wet).toContain(at(mid - 2, mid + 1));
    expect(PAL.soil).toContain(at(mid + 8, mid - 7));
  });

  it("est déterministe", () => {
    expect(holeBuf()).toEqual(b);
  });
});

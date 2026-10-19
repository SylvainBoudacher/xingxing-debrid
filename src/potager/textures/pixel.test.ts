import { describe, expect, it } from "vitest";
import { createRng, outlinePixels } from "./pixel";

describe("hasard déterministe", () => {
  it("rejoue la même suite pour la même graine", () => {
    const a = createRng(1),
      b = createRng(1);
    const sa = Array.from({ length: 5 }, a),
      sb = Array.from({ length: 5 }, b);
    expect(sa).toEqual(sb);
    for (const v of sa) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("contour automatique", () => {
  const center = () => {
    const d = new Uint8ClampedArray(3 * 3 * 4);
    d.set([200, 100, 50, 255], 4 * 4);
    return d;
  };
  const alpha = (d: Uint8ClampedArray, x: number, y: number) => d[(y * 3 + x) * 4 + 3];

  it("entoure un pixel opaque sur ses 4 côtés", () => {
    const out = outlinePixels(center(), 3, 3);
    for (const [x, y] of [
      [1, 0],
      [0, 1],
      [2, 1],
      [1, 2],
    ])
      expect(alpha(out, x, y)).toBe(255);
  });

  it("laisse les coins transparents", () => {
    const out = outlinePixels(center(), 3, 3);
    for (const [x, y] of [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ])
      expect(alpha(out, x, y)).toBe(0);
  });

  it("ne touche jamais un pixel déjà opaque", () => {
    const out = outlinePixels(center(), 3, 3);
    expect([...out.slice(16, 20)]).toEqual([200, 100, 50, 255]);
  });
});

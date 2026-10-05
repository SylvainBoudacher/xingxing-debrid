import { describe, expect, it } from "vitest";
import { pickMask } from "./pickMask";

// Image RGBA de w x h, opaque aux pixels donnés.
function rgba(w: number, h: number, opaque: [number, number][]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (const [x, y] of opaque) data[(y * w + x) * 4 + 3] = 255;
  return data;
}

describe("pickMask", () => {
  it("élargit chaque pixel opaque du rayon demandé", () => {
    const mask = pickMask(rgba(7, 7, [[3, 3]]), 7, 7, 2);
    expect(mask[3 * 7 + 3]).toBe(1);
    expect(mask[3 * 7 + 1]).toBe(1);
    expect(mask[5 * 7 + 5]).toBe(1);
    expect(mask[3 * 7 + 0]).toBe(0);
    expect(mask[0]).toBe(0);
  });

  it("reste dans l'image au bord", () => {
    const mask = pickMask(rgba(3, 3, [[0, 0]]), 3, 3, 1);
    expect(Array.from(mask)).toEqual([1, 1, 0, 1, 1, 0, 0, 0, 0]);
  });

  it("une image transparente ne donne aucune prise", () => {
    expect(pickMask(rgba(4, 4, []), 4, 4, 2).every((v) => v === 0)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { outlineMask } from "./outline";

const grid = (rows: string[]) =>
  rows
    .join("")
    .split("")
    .map((c) => c === "#");
const show = (mask: boolean[], w: number) =>
  Array.from({ length: mask.length / w }, (_, y) =>
    mask
      .slice(y * w, y * w + w)
      .map((on) => (on ? "o" : "."))
      .join(""),
  );

describe("outlineMask", () => {
  it("entoure la silhouette d'un pixel, diagonales comprises", () => {
    const w = 5;
    const mask = outlineMask(grid([".....", ".....", "..#..", ".....", "....."]), w, 5);
    expect(show(mask, w)).toEqual([".....", ".ooo.", ".o.o.", ".ooo.", "....."]);
  });

  it("ne déborde pas du tampon et ignore l'intérieur", () => {
    const w = 3;
    const mask = outlineMask(grid(["##.", "##.", "..."]), w, 3);
    expect(show(mask, w)).toEqual(["..o", "..o", "ooo"]);
  });
});

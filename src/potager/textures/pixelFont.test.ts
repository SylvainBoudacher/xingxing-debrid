import { describe, expect, it } from "vitest";
import { GLYPHS, textWidth } from "./pixelFont";

describe("police des enseignes", () => {
  it("a des glyphes de 3x5 pixels", () => {
    for (const [ch, g] of Object.entries(GLYPHS)) expect(g, ch).toMatch(/^[.#]{15}$/);
  });

  it("couvre les lettres et les chiffres", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") expect(GLYPHS, ch).toHaveProperty(ch);
  });

  it("espace les lettres d'un pixel", () => {
    expect(textWidth("PO")).toBe(7);
  });
});

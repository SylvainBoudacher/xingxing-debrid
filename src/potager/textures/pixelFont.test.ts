import { describe, expect, it } from "vitest";
import { glyphOf, GLYPHS, textWidth } from "./pixelFont";

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

describe("lettres accentuées", () => {
  it("dessine É comme un E surmonté d'un accent", () => {
    expect(glyphOf("é")).toEqual({ glyph: GLYPHS.E, accent: true });
    expect(glyphOf("E")).toEqual({ glyph: GLYPHS.E, accent: false });
    expect(glyphOf("à")).toEqual({ glyph: GLYPHS.A, accent: true });
  });
});

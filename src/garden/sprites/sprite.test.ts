import { describe, expect, it } from "vitest";
import type { SpeciesId } from "../core/types";
import { buf, ell, outline, rampAt, type Ramp } from "./raster";
import { renderSpriteBuf, spriteKey } from "./sprite";

const RAMP: Ramp = ["#000000", "#444444", "#888888", "#cccccc"];
const opaque = (b: { c: (string | null)[] }) => b.c.filter(Boolean).length;

describe("raster", () => {
  it("rampAt choisit le ton selon la lumière", () => {
    expect(rampAt(RAMP, -1)).toBe("#000000");
    expect(rampAt(RAMP, 0.3)).toBe("#444444");
    expect(rampAt(RAMP, 2)).toBe("#cccccc");
  });

  it("outline entoure la forme d'un pixel de contour", () => {
    const b = buf(10, 10);
    ell(b, 1, 5, 5, 2, 2, 0, () => "#ff0000");
    const before = opaque(b);
    outline(b);
    expect(opaque(b)).toBeGreaterThan(before);
    expect(b.c[0]).toBeNull();
  });
});

describe("renderSpriteBuf", () => {
  const species: SpeciesId[] = [
    "tournesol",
    "rosetremiere",
    "dahlia",
    "cosmos",
    "aster",
    "chrysantheme",
    "bruyere",
    "colchique",
  ];

  it.each(species)("%s produit un sprite 48x72 non vide", (name) => {
    const b = renderSpriteBuf({ name, color: "violet" });
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(opaque(b)).toBeGreaterThan(200);
  });

  it("les étapes et le décor produisent des sprites non vides", () => {
    for (const name of [
      "graine",
      "pousse",
      "jeune",
      "bouton",
      "cloture",
      "lanterne",
      "citrouille",
      "paille",
      "trou",
      "tas",
    ] as const) {
      expect(opaque(renderSpriteBuf({ name }))).toBeGreaterThan(20);
    }
  });

  it("l'arbre est trois fois plus grand", () => {
    const b = renderSpriteBuf({ name: "arbre" });
    expect([b.w, b.h]).toEqual([144, 216]);
  });

  it("deux couleurs donnent deux clés et deux rendus différents", () => {
    expect(spriteKey({ name: "dahlia", color: "red" })).not.toBe(
      spriteKey({ name: "dahlia", color: "violet" }),
    );
    const a = renderSpriteBuf({ name: "dahlia", color: "red" }).c.join();
    const b = renderSpriteBuf({ name: "dahlia", color: "violet" }).c.join();
    expect(a).not.toBe(b);
  });
});

describe("icônes et corbeau", () => {
  it.each(["main", "transplantoir", "arrosoir", "secateur", "rateau", "corbeau"] as const)(
    "%s produit un sprite 48x72 non vide",
    (name) => {
      const b = renderSpriteBuf({ name });
      expect([b.w, b.h]).toEqual([48, 72]);
      expect(opaque(b)).toBeGreaterThan(40);
    },
  );
});

import { describe, expect, it } from "vitest";
import { CATALOG_ENTRIES } from "../core/catalog/species";
import { PAL } from "./palette";
import { buf, crop, curveAt, ell, outline, put, rampAt, type Ramp } from "./raster";
import { amarante } from "./species/amarante";
import { anemone } from "./species/anemone";
import { heliopsis } from "./species/heliopsis";
import { lanternelune } from "./species/lanternelune";
import { sedum } from "./species/sedum";
import { vergedor } from "./species/vergedor";
import { drawBuf, renderSpriteBuf, spriteKey } from "./sprite";

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
  it("les 65 entrées du catalogue produisent un sprite 48x72 non vide", () => {
    for (const { species, color } of CATALOG_ENTRIES) {
      const b = renderSpriteBuf({ name: species, color });
      expect([b.w, b.h]).toEqual([48, 72]);
      expect(opaque(b)).toBeGreaterThan(200);
    }
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

describe("crop", () => {
  it("recadre sur les pixels dessinés avec une marge", () => {
    const b = buf(10, 10);
    put(b, 3, 6, "#ff0000");
    put(b, 5, 8, "#00ff00");
    const c = crop(b, 1);
    expect([c.w, c.h]).toEqual([5, 5]);
    expect(c.c[1 * 5 + 1]).toBe("#ff0000");
    expect(c.c[3 * 5 + 3]).toBe("#00ff00");
    expect(c.c.filter(Boolean)).toHaveLength(2);
  });

  it("une icône d'outil est bien plus petite que le sprite entier", () => {
    const c = crop(renderSpriteBuf({ name: "arrosoir" }), 1);
    expect(c.h).toBeLessThan(40);
    expect(c.c.filter(Boolean).length).toBe(
      renderSpriteBuf({ name: "arrosoir" }).c.filter(Boolean).length,
    );
  });
});

describe("curveAt", () => {
  it("part du premier point et arrive au second", () => {
    expect(curveAt(0, 0, 10, 20, 3, 0)).toEqual([0, 0]);
    expect(curveAt(0, 0, 10, 20, 3, 1)).toEqual([10, 20]);
  });

  it("le point de contrôle décale le milieu", () => {
    const [x] = curveAt(0, 0, 10, 0, 4, 0.5);
    expect(x).toBeCloseTo(7);
  });
});

describe("palette", () => {
  it("les nouvelles gammes ont 4 tons", () => {
    for (const key of ["blue", "burgundy", "apricot", "black", "lime"] as const)
      expect(PAL[key]).toHaveLength(4);
  });
});

describe("drawBuf", () => {
  it("dessine une fonction dans un tampon 48x72 avec contour", () => {
    const b = drawBuf((buf, k) => ell(buf, k, 16, 24, 4, 4, 0, () => "#ff0000"), PAL.red);
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(b.c.some((c) => c && c !== "#ff0000")).toBe(true);
  });
});

describe("nouvelles espèces", () => {
  it.each([
    ["anemone", anemone],
    ["sedum", sedum],
    ["amarante", amarante],
    ["vergedor", vergedor],
    ["heliopsis", heliopsis],
    ["lanternelune", lanternelune],
  ] as const)("%s produit un sprite non vide qui dépend de la couleur", (_name, draw) => {
    const a = drawBuf(draw, PAL.pink);
    expect(opaque(a)).toBeGreaterThan(200);
    expect(a.c.join()).not.toBe(drawBuf(draw, PAL.blue).c.join());
  });
});

describe("variantes", () => {
  it("la variante change la clé et le rendu", () => {
    const plain = { name: "cosmos", color: "pink" } as const;
    const frost = { ...plain, variant: "givree" } as const;
    expect(spriteKey(frost)).not.toBe(spriteKey(plain));
    expect(renderSpriteBuf(frost).c.join()).not.toBe(renderSpriteBuf(plain).c.join());
  });
});

import { describe, expect, it } from "vitest";
import { clampView, fitSize, HOME, isHome, zoomAt } from "./panZoom";

const viewport = { w: 1000, h: 800 };

describe("fitSize", () => {
  it("garde les proportions de l'arbre et tient dans le cadre", () => {
    expect(fitSize({ w: 2000, h: 640 }, 1)).toEqual({ w: 1000, h: 640 });
    expect(fitSize({ w: 500, h: 900 }, 1)).toEqual({ w: 500, h: 320 });
  });
});

describe("zoomAt", () => {
  it("zoome au centre sans déplacer l'arbre", () => {
    expect(zoomAt(HOME, { x: 500, y: 400 }, 2, viewport)).toEqual({ dx: 0, dy: 0, k: 2 });
  });

  it("garde le point sous le curseur fixe", () => {
    // le point (700, 400) est à 200 px du centre ; à 2x il le serait à 400 px
    expect(zoomAt(HOME, { x: 700, y: 400 }, 2, viewport)).toEqual({ dx: -200, dy: 0, k: 2 });
  });

  it("borne l'échelle", () => {
    expect(zoomAt(HOME, { x: 500, y: 400 }, 10, viewport).k).toBe(2);
    expect(zoomAt(HOME, { x: 500, y: 400 }, 0.1, viewport).k).toBe(0.6);
  });
});

describe("clampView", () => {
  const tree = { w: 900, h: 576 };

  it("laisse un déplacement raisonnable intact", () => {
    expect(clampView({ dx: 100, dy: -50, k: 1 }, viewport, tree)).toEqual({
      dx: 100,
      dy: -50,
      k: 1,
    });
  });

  it("empêche l'arbre de sortir du cadre", () => {
    // demi-largeur 450 : le centre peut aller jusqu'à 1000 - 80 + 450 = 1370, soit dx 870
    expect(clampView({ dx: 5000, dy: -5000, k: 1 }, viewport, tree)).toEqual({
      dx: 870,
      dy: -608,
      k: 1,
    });
  });
});

describe("isHome", () => {
  it("reconnaît le cadrage par défaut", () => {
    expect(isHome(HOME)).toBe(true);
    expect(isHome({ dx: 3, dy: 0, k: 1 })).toBe(false);
  });
});

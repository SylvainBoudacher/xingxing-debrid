import { describe, expect, it } from "vitest";
import { fieldRect } from "../core/plots";
import type { PlotId } from "../core/types";
import { framing, VIEWS } from "./framing";
import { wx, wz } from "./world";

const ALL: PlotId[] = ["p1", "p2", "p3", "p4"];
const dist = (plots: PlotId[]) => {
  const f = framing(VIEWS.garden, fieldRect(plots));
  return Math.hypot(f.y - f.look[1], f.z - f.look[2]);
};

describe("framing", () => {
  it("garde le cadrage d'origine pour le champ de départ", () => {
    for (const view of [VIEWS.garden, VIEWS.backdrop]) {
      const f = framing(view, fieldRect(["p1"]));
      expect(f.y).toBeCloseTo(view.y, 5);
      expect(f.z).toBeCloseTo(view.z, 5);
      expect(f.look[0]).toBeCloseTo(view.look[0], 5);
      expect(f.look[2]).toBeCloseTo(view.look[2], 5);
    }
  });

  it("vise le centre du champ", () => {
    const rect = fieldRect(ALL);
    const f = framing(VIEWS.garden, rect);
    const cx = (wx(rect.x) + wx(rect.x + rect.w - 1)) / 2;
    const cz = (wz(rect.y) + wz(rect.y + rect.h - 1)) / 2;
    expect(f.look[0]).toBeCloseTo(cx + (VIEWS.garden.look[0] - 0.5), 5);
    expect(f.look[2]).toBeCloseTo(cz + (VIEWS.garden.look[2] - 0.5), 5);
  });

  it("recule à chaque agrandissement, sans jamais doubler", () => {
    const one = dist(["p1"]);
    const two = dist(["p1", "p2"]);
    const three = dist(["p1", "p2", "p3"]);
    expect(two).toBeGreaterThan(one);
    expect(three).toBeGreaterThan(two);
    expect(dist(ALL)).toBe(three);
    expect(three).toBeLessThan(one * 2);
  });

  it("garde la hauteur de visée", () => {
    expect(framing(VIEWS.garden, fieldRect(ALL)).look[1]).toBe(VIEWS.garden.look[1]);
  });
});

import { describe, expect, it } from "vitest";
import { advance, chanceOf, GAUGES, maxDry } from "./pity";

describe("jauges de pity", () => {
  it("part de 25 % et monte de 2 points par graine sèche", () => {
    expect(chanceOf(GAUGES.discovery, 0)).toBeCloseTo(0.25);
    expect(chanceOf(GAUGES.discovery, 1)).toBeCloseTo(0.27);
    expect(chanceOf(GAUGES.discovery, 10)).toBeCloseTo(0.45);
    expect(chanceOf(GAUGES.rare, 5)).toBeCloseTo(0.35);
  });

  it("plafonne à 75 % (nouveauté) et 70 % (rareté)", () => {
    expect(chanceOf(GAUGES.discovery, 25)).toBeCloseTo(0.75);
    expect(chanceOf(GAUGES.discovery, 999)).toBeCloseTo(0.75);
    expect(chanceOf(GAUGES.rare, 23)).toBeCloseTo(0.7);
    expect(chanceOf(GAUGES.rare, 999)).toBeCloseTo(0.7);
  });

  it("un compteur négatif vaut la base", () => {
    expect(chanceOf(GAUGES.rare, -3)).toBeCloseTo(0.25);
  });

  it("avance d'une graine sans dépasser le compteur utile", () => {
    expect(advance(GAUGES.discovery, 0)).toBe(1);
    expect(maxDry(GAUGES.discovery)).toBe(25);
    expect(maxDry(GAUGES.rare)).toBe(23);
    expect(advance(GAUGES.discovery, 25)).toBe(25);
    expect(advance(GAUGES.rare, 999)).toBe(23);
  });
});

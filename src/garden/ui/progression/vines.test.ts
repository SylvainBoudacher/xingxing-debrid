import { describe, expect, it } from "vitest";
import { vinePath, vinePointAt } from "./vines";

const from = { x: 500, y: 575 };
const to = { x: 330, y: 470 };

describe("vinePath", () => {
  it("relie le parent à l'enfant par une courbe", () => {
    expect(vinePath(from, to)).toBe("M500 575 C500 522.5, 330 552.5, 330 470");
  });
});

describe("vinePointAt", () => {
  it("part du parent et arrive à l'enfant", () => {
    expect(vinePointAt(from, to, 0)).toEqual(from);
    expect(vinePointAt(from, to, 1)).toEqual(to);
  });

  it("reste entre les deux au milieu", () => {
    const mid = vinePointAt(from, to, 0.5);
    expect(mid.x).toBeGreaterThan(to.x);
    expect(mid.x).toBeLessThan(from.x);
    expect(mid.y).toBeGreaterThan(to.y);
    expect(mid.y).toBeLessThan(from.y);
  });
});

import { describe, expect, it } from "vitest";
import { DAY } from "./time";
import { isRaining, rainIntervals } from "./weather";

const start = new Date(2026, 8, 1).getTime();
const end = start + 60 * DAY;

describe("rainIntervals", () => {
  it("donne les mêmes averses pour la même période", () => {
    expect(rainIntervals(start, end)).toEqual(rainIntervals(start, end));
  });

  it("a des averses de 30 à 90 minutes, entre 6 h et 21 h", () => {
    const list = rainIntervals(start, end);
    expect(list.length).toBeGreaterThan(5);
    for (const r of list) {
      const minutes = (r.end - r.start) / 60_000;
      expect(minutes).toBeGreaterThanOrEqual(30);
      expect(minutes).toBeLessThanOrEqual(90);
      expect(new Date(r.start).getHours()).toBeGreaterThanOrEqual(6);
      expect(new Date(r.start).getHours()).toBeLessThanOrEqual(19);
    }
  });

  it("ne renvoie que ce qui touche la fenêtre demandée", () => {
    const all = rainIntervals(start, end);
    const first = all[0];
    const inside = rainIntervals(first.start + 1, first.start + 2);
    expect(inside).toEqual([first]);
  });

  it("isRaining suit les intervalles", () => {
    const first = rainIntervals(start, end)[0];
    expect(isRaining(first.start + 1000)).toBe(true);
    expect(isRaining(first.end + 1000)).toBe(false);
  });
});

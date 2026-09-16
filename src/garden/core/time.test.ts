import { describe, expect, it } from "vitest";
import { contains, coveredDuration, mergeIntervals } from "./time";

describe("mergeIntervals", () => {
  it("fusionne les intervalles qui se chevauchent ou se touchent", () => {
    expect(
      mergeIntervals([
        { start: 10, end: 20 },
        { start: 0, end: 5 },
        { start: 15, end: 30 },
        { start: 30, end: 35 },
      ]),
    ).toEqual([
      { start: 0, end: 5 },
      { start: 10, end: 35 },
    ]);
  });

  it("ignore les intervalles vides ou inversés", () => {
    expect(
      mergeIntervals([
        { start: 5, end: 5 },
        { start: 9, end: 3 },
      ]),
    ).toEqual([]);
  });
});

describe("coveredDuration", () => {
  it("ne compte que la partie dans la fenêtre, sans double comptage", () => {
    const list = [
      { start: 0, end: 10 },
      { start: 5, end: 15 },
      { start: 20, end: 30 },
    ];
    expect(coveredDuration(list, 8, 25)).toBe(12);
  });

  it("vaut 0 quand la fenêtre est vide ou inversée", () => {
    expect(coveredDuration([{ start: 0, end: 10 }], 10, 5)).toBe(0);
  });
});

describe("contains", () => {
  it("inclut le début et exclut la fin", () => {
    const list = [{ start: 10, end: 20 }];
    expect(contains(list, 10)).toBe(true);
    expect(contains(list, 19)).toBe(true);
    expect(contains(list, 20)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import type { TileKey } from "../core/types";
import { hidingTiles } from "./occlusion";

describe("hidingTiles", () => {
  const all: TileKey[] = ["3,1", "3,2", "3,3", "3,4", "3,5", "2,3", "4,3"];

  it("garde les deux rangées devant la case, dans sa colonne", () => {
    expect(hidingTiles("3,2", all)).toEqual(["3,3", "3,4"]);
  });

  it("ignore la case elle-même, celles de derrière et les colonnes voisines", () => {
    const out = hidingTiles("3,2", all);
    expect(out).not.toContain("3,2");
    expect(out).not.toContain("3,1");
    expect(out).not.toContain("2,3");
    expect(out).not.toContain("4,3");
  });

  it("rien devant la dernière rangée", () => {
    expect(hidingTiles("3,5", all)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { createStarterSave } from "../../core/starter";
import { specimensOf, tiltOf } from "./plate";

describe("specimensOf", () => {
  it("trie par rareté puis ordre du catalogue et joint les entrées", () => {
    const save = {
      ...createStarterSave(),
      herbier: { "dahlia:pink": { discoveredAt: 1, pressed: 2, variants: [] } },
    };
    const list = specimensOf(save, "dahlia");
    expect(list.map((s) => s.color)).toEqual([
      "red",
      "orange",
      "pink",
      "apricot",
      "burgundy",
      "blue",
    ]);
    expect(list[2].entry?.pressed).toBe(2);
    expect(list[0].entry).toBeNull();
  });
});

describe("tiltOf", () => {
  it("alterne des inclinaisons légères", () => {
    const tilts = [0, 1, 2, 3, 4, 5].map(tiltOf);
    expect(tilts.every((t) => Math.abs(t) <= 3)).toBe(true);
    expect(new Set(tilts).size).toBeGreaterThan(2);
  });
});

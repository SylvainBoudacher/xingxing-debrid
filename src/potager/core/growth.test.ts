import { describe, expect, it } from "vitest";
import { advanceGarden, markSeen, stageOf } from "./growth";
import { createStarterSave } from "./save";
import { entryKey } from "./seeds";
import type { Cell, PotagerSave, Seed } from "./types";

const seed: Seed = { rarity: "commune", species: "tournesol", color: "yellow" };
const plant = (extra: Partial<Extract<Cell, { kind: "plante" }>> = {}): Cell => ({
  kind: "plante",
  seed,
  progress: 0,
  loose: false,
  sowGrade: "rate",
  wetUntil: 0,
  wetGrade: "rate",
  seen: true,
  ...extra,
});

function withCells(cells: Cell[], playTimeMs = 0): { save: PotagerSave; keys: string[] } {
  const s = createStarterSave();
  const keys = Object.keys(s.cells).slice(0, cells.length);
  const next = { ...s.cells };
  keys.forEach((k, i) => (next[k] = cells[i]));
  return { save: { ...s, cells: next, playTimeMs }, keys };
}

const progressOf = (s: PotagerSave, k: string) => {
  const c = s.cells[k];
  return c.kind === "plante" ? c.progress : NaN;
};

describe("pousse", () => {
  it("avance au rythme de la rareté", () => {
    const { save, keys } = withCells([plant()]);
    const s = advanceGarden(save, 300_000);
    expect(progressOf(s, keys[0])).toBeCloseTo(0.5);
    expect(stageOf(0.5)).toBe(2);
  });

  it("accélère tant que la terre est humide", () => {
    const { save, keys } = withCells([plant({ wetUntil: 1_000_000, wetGrade: "parfait" })]);
    expect(progressOf(advanceGarden(save, 300_000), keys[0])).toBeCloseTo(0.75);
  });

  it("n'accélère plus une fois la terre sèche", () => {
    const { save, keys } = withCells([plant({ wetUntil: 10, wetGrade: "parfait" })], 1000);
    expect(progressOf(advanceGarden(save, 300_000), keys[0])).toBeCloseTo(0.5);
  });

  it("raccourcit la première étape après un semis parfait", () => {
    const { save, keys } = withCells([plant({ sowGrade: "parfait" })]);
    expect(progressOf(advanceGarden(save, 0.25 * 600_000 * 0.7), keys[0])).toBeCloseTo(0.25);
  });

  it("fait éclore et découvre l'entrée une seule fois", () => {
    const { save, keys } = withCells([plant()]);
    const s = advanceGarden(save, 600_000);
    const c = s.cells[keys[0]];
    expect(c.kind === "plante" && c.progress).toBe(1);
    expect(c.kind === "plante" && c.seen).toBe(false);
    const entry = s.herbier[entryKey("tournesol", "yellow")];
    expect(entry).toEqual({ discoveredAt: 0, announced: false });
    const again = advanceGarden({ ...s, playTimeMs: 5000 }, 1000);
    expect(again.herbier[entryKey("tournesol", "yellow")]).toEqual(entry);
  });

  it("annonce une découverte une seule fois", () => {
    const { save, keys } = withCells([plant(), plant()]);
    const s = advanceGarden(save, 600_000);
    const first = markSeen(s, keys[0]);
    expect(first.announce).toEqual({ species: "tournesol", color: "yellow" });
    const second = markSeen(first.save, keys[1]);
    expect(second.announce).toBeNull();
    const c = second.save.cells[keys[1]];
    expect(c.kind === "plante" && c.seen).toBe(true);
  });
});

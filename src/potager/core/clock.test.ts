import { describe, expect, it } from "vitest";
import { advancePlayTime, stepSim } from "./clock";
import { createStarterSave } from "./save";

describe("temps de jeu", () => {
  it("ajoute le temps écoulé", () => {
    expect(advancePlayTime(createStarterSave(), 1000).playTimeMs).toBe(1000);
  });

  it("ignore une horloge qui recule", () => {
    expect(advancePlayTime(createStarterSave(), -5000).playTimeMs).toBe(0);
  });

  it("plafonne un pas à 10 minutes (veille)", () => {
    expect(advancePlayTime(createStarterSave(), 3 * 3_600_000).playTimeMs).toBe(600_000);
  });

  it("ne modifie pas la sauvegarde d'origine", () => {
    const s = createStarterSave();
    advancePlayTime(s, 1000);
    expect(s.playTimeMs).toBe(0);
  });

  it("plafonne aussi la pousse d'un pas de simulation", () => {
    const start = createStarterSave();
    const key = Object.keys(start.cells)[0];
    const s = stepSim(
      {
        ...start,
        cells: {
          ...start.cells,
          [key]: {
            kind: "plante",
            seed: { rarity: "legendaire", species: "tournesol", color: "white" },
            progress: 0,
            loose: false,
            sowGrade: "rate",
            wetUntil: 0,
            wetGrade: "rate",
            seen: true,
          },
        },
        // gêneurs déjà au maximum, loin de la plante : seule la pousse est mesurée
        weeds: { "p0:5:0": { at: 0 }, "p0:5:1": { at: 0 }, "p0:5:2": { at: 0 } },
        crows: { "p0:4:0": { leaveAt: 1e12 }, "p0:4:1": { leaveAt: 1e12 } },
      },
      3 * 3_600_000,
      () => 0.999,
    );
    expect(s.playTimeMs).toBe(600_000);
    const c = s.cells[key];
    expect(c.kind === "plante" && c.progress).toBeCloseTo(600_000 / 1_800_000);
  });

  it("fait apparaître gêneurs et forêt pendant un pas", () => {
    const s = stepSim(createStarterSave(), 600_000, () => 0);
    expect(Object.keys(s.weeds).length).toBeGreaterThan(0);
    expect(Object.keys(s.forest).length).toBeGreaterThan(0);
  });
});

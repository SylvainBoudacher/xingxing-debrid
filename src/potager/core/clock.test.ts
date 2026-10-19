import { describe, expect, it } from "vitest";
import { advancePlayTime } from "./clock";
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
});

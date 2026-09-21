import { describe, expect, it } from "vitest";
import { creditDaily } from "./sachets";
import { createStarterSave } from "./starter";
import { DAY, startOfDay } from "./time";
import { sachetsPerDay } from "./unlocks";
import type { GardenSave } from "./types";

const NOW = new Date(2026, 9, 20, 15, 30).getTime();

const withNode = (id: string): GardenSave => {
  const s = createStarterSave();
  return { ...s, progress: { ...s.progress, nodes: { [id]: 1 } } };
};

describe("sachetsPerDay", () => {
  it("donne un sachet par jour au départ", () => {
    expect(sachetsPerDay(createStarterSave())).toBe(1);
    expect(sachetsPerDay(withNode("j2"))).toBe(1);
  });

  it("en donne deux une fois Main verte récupéré", () => {
    expect(sachetsPerDay(withNode("j1"))).toBe(2);
  });
});

describe("creditDaily avec deux sachets par jour", () => {
  it("crédite deux sachets par jour écoulé", () => {
    const s: GardenSave = {
      ...createStarterSave(),
      sachets: { lastDailyAt: startOfDay(NOW) - 2 * DAY, pending: [] },
    };
    expect(creditDaily(s, NOW, 2).sachets.pending).toHaveLength(4);
    expect(creditDaily(s, NOW, 1).sachets.pending).toHaveLength(2);
  });
});

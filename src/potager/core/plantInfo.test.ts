import { describe, expect, it } from "vitest";
import { plantInfo } from "./plantInfo";
import { createStarterSave } from "./save";
import type { Cell, PotagerSave } from "./types";

const plant = (extra: Partial<Extract<Cell, { kind: "plante" }>> = {}): Cell => ({
  kind: "plante",
  seed: { rarity: "rare", species: "tournesol", color: "yellow" },
  progress: 0.5,
  loose: false,
  sowGrade: "bien",
  wetUntil: 0,
  wetGrade: "rate",
  seen: true,
  ...extra,
});

function withPlant(
  extra: Partial<Extract<Cell, { kind: "plante" }>> = {},
  patch: Partial<PotagerSave> = {},
) {
  const s = createStarterSave();
  const key = Object.keys(s.cells)[0];
  return { save: { ...s, ...patch, cells: { ...s.cells, [key]: plant(extra) } }, key };
}

describe("infos de plante", () => {
  it("ignore une case sans plante", () => {
    const s = createStarterSave();
    expect(plantInfo(s, "p0:99:99")).toBeNull();
  });

  it("donne rareté, qualité du semis et stade, sans espèce ni couleur", () => {
    const { save, key } = withPlant();
    const info = plantInfo(save, key)!;
    expect(info).toMatchObject({ rarity: "rare", sowGrade: "bien", stage: 2, progress: 0.5 });
    expect(JSON.stringify(info)).not.toMatch(/tournesol|yellow/);
  });

  it("conseille d'arroser une terre sèche, puis la patience", () => {
    const dry = withPlant();
    expect(plantInfo(dry.save, dry.key)!.tip).toMatch(/Arrose/);
    const wet = withPlant({ wetUntil: 100_000 });
    expect(plantInfo(wet.save, wet.key)).toMatchObject({
      wetMs: 100_000,
      tip: "Tout va bien, patience.",
    });
  });

  it("signale une corneille et coupe l'échéance", () => {
    const { save, key } = withPlant();
    const info = plantInfo({ ...save, crows: { [key]: { leaveAt: 1e9 } } }, key)!;
    expect(info.etaMs).toBeNull();
    expect(info.tip).toMatch(/corneille/);
  });

  it("signale une herbe voisine", () => {
    const { save, key } = withPlant();
    expect(plantInfo({ ...save, weeds: { [key]: { at: 0 } } }, key)!.tip).toMatch(/herbe/);
  });

  it("annonce une fleur prête sans échéance", () => {
    const { save, key } = withPlant({ progress: 1 });
    const info = plantInfo(save, key)!;
    expect(info).toMatchObject({ stage: 4, etaMs: null });
    expect(info.tip).toMatch(/cueille/);
  });
});

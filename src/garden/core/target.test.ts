import { describe, expect, it } from "vitest";
import { createStarterSave } from "./starter";
import { describeCrow, describeTile } from "./target";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const aster = (age: number, watered: Interval[] = []): PlantTile => ({
  kind: "plant",
  seed: { species: "aster", color: "violet", rarity: "commune" },
  sownAt: NOW - age,
  watered,
});

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

const describe1 = (s: GardenSave, key: `${number},${number}`) =>
  describeTile(s, key, NOW, { rain: noRain });

describe("describeTile", () => {
  it("herbe et terre libre", () => {
    const s = withTiles({});
    expect(describe1(s, "0,0")).toEqual({ kind: "grass", title: "Herbe", lines: [] });
    expect(describe1(s, "1,1")).toEqual({
      kind: "soil",
      title: "Terre",
      lines: ["Libre : creuse un trou pour semer"],
    });
  });

  it("trou, avec ou sans graines", () => {
    const s = withTiles({ "1,1": { kind: "hole", dugAt: NOW } });
    expect(describe1(s, "1,1").lines).toEqual(["Prêt à recevoir une graine commune"]);
    const empty = { ...s, inventory: { ...s.inventory, seeds: [] } };
    expect(describe1(empty, "1,1").lines).toEqual(["Plus de graines"]);
  });

  it("tas de feuilles et décor", () => {
    const s = withTiles({
      "0,0": { kind: "leaves", since: 0 },
      "0,1": { kind: "decor", id: "paille" },
    });
    expect(describe1(s, "0,0")).toMatchObject({ kind: "leaves", title: "Tas de feuilles" });
    expect(describe1(s, "0,1")).toMatchObject({ kind: "decor", title: "Botte de paille" });
  });

  it("graine sèche : temps restant, terre sèche, espèce cachée", () => {
    const info = describe1(withTiles({ "1,1": aster(1 * HOUR) }), "1,1");
    expect(info).toEqual({
      kind: "plant",
      title: "Graine",
      progress: 0.5,
      lines: [
        "Prochaine étape dans ~1 h",
        "Terre sèche : arrose pour pousser plus vite",
        "Espèce et couleur inconnues",
      ],
    });
  });

  it("plante mouillée : temps restant accéléré et durée d'humidité", () => {
    const p = aster(1 * HOUR, [{ start: NOW - HOUR, end: NOW + 5 * HOUR }]);
    const info = describe1(withTiles({ "1,1": p }), "1,1");
    expect(info.progress).toBe(0.75);
    expect(info.lines.slice(0, 2)).toEqual(["Prochaine étape dans ~20 min", "Mouillée encore 5 h"]);
  });

  it("l'humidité qui s'arrête avant l'étape rallonge le temps restant", () => {
    // 45 min efficaces faites, reste 75 : 20 min mouillées en donnent 30, puis 45 min au sec
    const p = aster(30 * 60_000, [{ start: NOW - HOUR, end: NOW + 20 * 60_000 }]);
    const info = describe1(withTiles({ "1,1": p }), "1,1");
    expect(info.lines[0]).toBe("Prochaine étape dans ~1 h 05");
  });

  it("pas de ligne d'espèce après la graine", () => {
    const info = describe1(withTiles({ "1,1": aster(3 * HOUR) }), "1,1");
    expect(info.title).toBe("Pousse");
    expect(info.lines).toHaveLength(2);
  });

  it("fleur éclose : nom, rareté et outil de cueillette", () => {
    const s = withTiles({
      "1,1": aster(9 * HOUR),
      "2,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "red", rarity: "epique" },
        sownAt: NOW - 20 * HOUR,
        watered: [],
      },
    });
    expect(describe1(s, "1,1")).toEqual({
      kind: "plant",
      title: "Aster violet",
      lines: ["Commune - tige fine : à la main"],
    });
    expect(describe1(s, "2,1").lines).toEqual(["Épique - tige épaisse : sécateur"]);
  });
});

describe("describeCrow", () => {
  it("décrit le corbeau", () => {
    expect(describeCrow()).toEqual({
      kind: "crow",
      title: "Corbeau",
      lines: ["Il picore tranquillement."],
    });
  });
});

describe("infobulle du trou", () => {
  it("annonce la rareté réellement semée", () => {
    const base = createStarterSave();
    const save: GardenSave = {
      ...base,
      inventory: {
        ...base.inventory,
        seeds: [
          { species: "tournesol", color: "yellow", rarity: "commune" },
          { species: "dahlia", color: "blue", rarity: "legendaire" },
        ],
      },
      tiles: { ...base.tiles, "1,1": { kind: "hole", dugAt: 0 } },
    };
    expect(describeTile(save, "1,1", NOW).lines).toEqual(["Prêt à recevoir une graine commune"]);
    expect(describeTile(save, "1,1", NOW, { seedRarity: "legendaire" }).lines).toEqual([
      "Prêt à recevoir une graine légendaire",
    ]);
    const empty = { ...save, inventory: { ...save.inventory, seeds: [] } };
    expect(describeTile(empty, "1,1", NOW).lines).toEqual(["Plus de graines"]);
  });
});

describe("plante révélée", () => {
  const revealNow = new Date(2026, 9, 1, 12).getTime();
  const dry = (): Interval[] => [];
  const withPlant = (revealed: boolean): GardenSave => ({
    ...createStarterSave(),
    tiles: {
      "1,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "blue", rarity: "legendaire" },
        sownAt: revealNow - HOUR,
        watered: [],
        revealed,
      },
    },
  });

  it("montre l'espèce et la couleur avant l'éclosion", () => {
    const lines = describeTile(withPlant(true), "1,1", revealNow, { rain: dry }).lines;
    expect(lines).toContain("Révélée : Dahlia bleu");
    expect(lines).not.toContain("Espèce et couleur inconnues");
  });

  it("garde le mystère sans révélation", () => {
    const lines = describeTile(withPlant(false), "1,1", revealNow, { rain: dry }).lines;
    expect(lines).toContain("Espèce et couleur inconnues");
  });
});

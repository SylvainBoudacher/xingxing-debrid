import { describe, expect, it } from "vitest";
import { effectiveMs, growthOf, WATER_MS } from "./growth";
import { DAY, HOUR } from "./time";
import type { Interval, PlantTile } from "./types";

const noRain = (): Interval[] => [];
const T0 = new Date(2026, 9, 1, 8).getTime();

function plant(
  watered: Interval[] = [],
  rarity: PlantTile["seed"]["rarity"] = "commune",
): PlantTile {
  return {
    kind: "plant",
    seed: { species: "aster", color: "violet", rarity },
    sownAt: T0,
    watered,
  };
}

const boosted = (boosts: number[], watered: Interval[] = []): PlantTile => ({
  ...plant(watered),
  boosts,
});

describe("growthOf", () => {
  it("une commune sèche passe une étape toutes les 2 h", () => {
    expect(growthOf(plant(), T0 + 1 * HOUR, noRain)).toMatchObject({
      stage: 0,
      stageProgress: 0.5,
    });
    expect(growthOf(plant(), T0 + 2 * HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0 });
    expect(growthOf(plant(), T0 + 8 * HOUR, noRain)).toMatchObject({ stage: 4, stageProgress: 1 });
  });

  it("une terre mouillée fait pousser 1,5 fois plus vite", () => {
    const p = plant([{ start: T0, end: T0 + WATER_MS }]);
    expect(effectiveMs(p, T0 + 2 * HOUR, noRain)).toBe(3 * HOUR);
    expect(growthOf(p, T0 + 2 * HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0.5 });
  });

  it("ne compte pas deux fois des arrosages qui se chevauchent", () => {
    const p = plant([
      { start: T0, end: T0 + 2 * HOUR },
      { start: T0 + 1 * HOUR, end: T0 + 3 * HOUR },
    ]);
    expect(effectiveMs(p, T0 + 4 * HOUR, noRain)).toBe(4 * HOUR + 1.5 * HOUR);
  });

  it("la pluie compte comme un arrosage, sans double comptage", () => {
    const rain = (): Interval[] => [{ start: T0 + 1 * HOUR, end: T0 + 3 * HOUR }];
    const p = plant([{ start: T0, end: T0 + 2 * HOUR }]);
    expect(effectiveMs(p, T0 + 4 * HOUR, rain)).toBe(4 * HOUR + 1.5 * HOUR);
  });

  it("indique si la case est mouillée maintenant", () => {
    const p = plant([{ start: T0, end: T0 + HOUR }]);
    expect(growthOf(p, T0 + 30 * 60_000, noRain).wet).toBe(true);
    expect(growthOf(p, T0 + 2 * HOUR, noRain).wet).toBe(false);
  });

  it("une légendaire met 30 h sans arrosage", () => {
    expect(growthOf(plant([], "legendaire"), T0 + 29 * HOUR, noRain).stage).toBe(3);
    expect(growthOf(plant([], "legendaire"), T0 + 30 * HOUR, noRain).stage).toBe(4);
  });

  it("une absence d'une semaine donne une fleur", () => {
    expect(growthOf(plant([], "epique"), T0 + 7 * DAY, noRain).stage).toBe(4);
  });

  it("si l'horloge recule, rien ne régresse sous zéro", () => {
    expect(growthOf(plant(), T0 - HOUR, noRain)).toMatchObject({ stage: 0, stageProgress: 0 });
  });

  it("belle plante : mouillée à chaque étape", () => {
    const always = plant([{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(always, T0 + 10 * HOUR, noRain).beautiful).toBe(true);
  });

  it("pas belle plante si une étape est restée sèche", () => {
    // mouillée seulement pendant la première heure : les étapes suivantes sont sèches
    const once = plant([{ start: T0, end: T0 + HOUR }]);
    expect(growthOf(once, T0 + 10 * HOUR, noRain).beautiful).toBe(false);
  });

  it("pas belle plante tant qu'elle n'a pas fleuri", () => {
    const always = plant([{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(always, T0 + HOUR, noRain).beautiful).toBe(false);
  });
});

describe("élixir de croissance", () => {
  it("fait gagner une étape d'un coup, à l'instant où il est versé", () => {
    const p = boosted([T0 + HOUR]);
    expect(effectiveMs(p, T0 + HOUR - 1, noRain)).toBe(HOUR - 1);
    expect(effectiveMs(p, T0 + HOUR, noRain)).toBe(3 * HOUR);
    expect(growthOf(p, T0 + HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0.5 });
  });

  it("ignore un élixir postérieur à l'instant demandé", () => {
    expect(effectiveMs(boosted([T0 + 5 * HOUR]), T0 + 2 * HOUR, noRain)).toBe(2 * HOUR);
  });

  it("cumule plusieurs élixirs", () => {
    expect(growthOf(boosted([T0, T0 + HOUR]), T0 + HOUR, noRain).stage).toBe(2);
  });

  it("fait éclore une plante au stade bouton", () => {
    const p = boosted([T0 + 7 * HOUR]);
    expect(growthOf(p, T0 + 7 * HOUR - 1, noRain).stage).toBe(3);
    expect(growthOf(p, T0 + 7 * HOUR, noRain).stage).toBe(4);
  });

  it("une étape entièrement sautée ne compte pas contre la belle plante", () => {
    // mouillée : l'étape 0 finit à 80 min, l'élixir saute toute l'étape 1
    const p = boosted([T0 + 80 * 60_000], [{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(p, T0 + 10 * HOUR, noRain).beautiful).toBe(true);
  });

  it("une étape vécue en partie doit toujours avoir été mouillée", () => {
    const p = boosted([T0 + 80 * 60_000], [{ start: T0, end: T0 + 80 * 60_000 }]);
    expect(growthOf(p, T0 + 10 * HOUR, noRain).beautiful).toBe(false);
  });
});

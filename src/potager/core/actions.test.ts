import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { applyAction, findTarget, prepareAction, type Target } from "./actions";
import { parcelCells } from "./cells";
import { advanceGarden } from "./growth";
import { setWater, waterLeft, withdrawTool } from "./inventory";
import { createStarterSave } from "./save";
import type { PotagerSave, Slot } from "./types";

const first = parcelCells("p0")[0];
const cell: Target = { kind: "cell", key: first.key };
const equipped = () => withdrawTool(withdrawTool(createStarterSave(), "beche")!, "arrosoir")!;
const never = () => 0.999;
// sac équipé : 0 graines, 1 bêche, 2 arrosoir
const SEEDS = 0,
  BECHE = 1,
  ARROSOIR = 2;
const act = (
  s: PotagerSave,
  t: Target,
  hand: number,
  grade: "parfait" | "bien" | "rate" = "bien",
  rng = never,
) => {
  const p = prepareAction(s, t, hand);
  if (!("gesture" in p)) throw new Error(p.message);
  return applyAction(s, t, p.gesture, { grade }, hand, rng).save;
};

describe("cibles", () => {
  it("vise la case devant l'avatar", () => {
    const pose = { x: first.center.x, z: first.center.z + 0.8, dir: { x: 0, z: -1 } };
    expect(findTarget(createStarterSave(), pose)).toEqual(cell);
  });

  it("vise la case sous l'avatar quand rien n'est devant", () => {
    const pose = { x: first.center.x, z: first.center.z, dir: { x: 0, z: -1 } };
    expect(findTarget(createStarterSave(), pose)).toEqual(cell);
  });

  it("vise l'abri tout proche", () => {
    const pose = { x: MAP.abri.x, z: MAP.abri.z + MAP.abri.d / 2 + 0.5, dir: { x: 0, z: 1 } };
    expect(findTarget(createStarterSave(), pose)).toEqual({ kind: "abri" });
  });

  it("ne vise rien en plein champ", () => {
    expect(findTarget(createStarterSave(), { x: -20, z: 3, dir: { x: 1, z: 0 } })).toBeNull();
  });
});

describe("actions", () => {
  it("réclame la bêche restée à l'abri", () => {
    expect(prepareAction(createStarterSave(), cell, 0)).toEqual({
      message: "Il te faut la bêche (elle est à l'abri)",
    });
    expect(prepareAction(equipped(), cell, BECHE)).toEqual({ gesture: "becher" });
  });

  it("exige l'outil en main", () => {
    const s = equipped();
    expect(prepareAction(s, cell, SEEDS)).toEqual({
      message: "Prends la bêche en main (touches 1 à 6)",
    });
    const dug = act(s, cell, BECHE);
    expect(prepareAction(dug, cell, BECHE)).toEqual({
      message: "Prends des graines en main (touches 1 à 6)",
    });
    const sown = act(dug, cell, SEEDS);
    expect(prepareAction(sown, cell, BECHE)).toEqual({
      message: "Prends l'arrosoir en main (touches 1 à 6)",
    });
    expect(prepareAction(s, { kind: "puits" }, BECHE)).toEqual({
      message: "Prends l'arrosoir en main (touches 1 à 6)",
    });
  });

  it("cueille à mains nues, quel que soit l'objet en main", () => {
    let s = act(act(equipped(), cell, BECHE), cell, SEEDS);
    s = advanceGarden(s, 3_600_000);
    expect(prepareAction(s, cell, 5)).toEqual({ gesture: "cueillir" });
  });

  it("mène une case de l'herbe à la cueillette", () => {
    let s = act(equipped(), cell, BECHE, "parfait");
    expect(s.cells[first.key]).toEqual({ kind: "bechee", loose: true });
    s = act(s, cell, SEEDS);
    const sown = s.cells[first.key];
    expect(sown.kind).toBe("plante");
    expect(s.inventory.find((x) => x?.kind === "seeds")?.kind === "seeds").toBe(true);
    const pile = s.inventory.find((x) => x?.kind === "seeds");
    expect(pile?.kind === "seeds" && pile.seeds).toHaveLength(4);
    s = act(s, cell, ARROSOIR);
    expect(waterLeft(s.inventory)).toBe(4);
    const c = s.cells[first.key];
    expect(c.kind === "plante" && c.wetUntil).toBeGreaterThan(s.playTimeMs);
    s = advanceGarden(s, 3_600_000);
    expect(prepareAction(s, cell, 0)).toEqual({ gesture: "cueillir" });
    s = act(s, cell, BECHE, "parfait");
    expect(s.cells[first.key]).toEqual({ kind: "herbe" });
    expect(s.inventory.some((x) => x?.kind === "flowers" && x.quality === "belle")).toBe(true);
  });

  it("refuse de cueillir sac plein, sans rien perdre", () => {
    let s = equipped();
    s = act(act(s, cell, BECHE), cell, SEEDS);
    s = advanceGarden(s, 3_600_000);
    const full: (Slot | null)[] = Array.from({ length: 6 }, () => ({
      kind: "flowers",
      species: "tournesol",
      color: "orange",
      quality: "ordinaire",
      count: 5,
    }));
    const blocked = { ...s, inventory: full };
    expect(prepareAction(blocked, cell, 0)).toEqual({ message: "Ton sac est plein" });
    expect(blocked.cells[first.key].kind).toBe("plante");
  });

  it("ne tire pas de graine bonus sans place pour elle", () => {
    let s = equipped();
    s = act(act(s, cell, BECHE), cell, SEEDS);
    s = advanceGarden(s, 3_600_000);
    const c = s.cells[first.key];
    if (c.kind !== "plante") throw new Error();
    const pile = (n: number): Slot => ({
      kind: "flowers",
      species: c.seed.species,
      color: c.seed.color,
      quality: "ordinaire",
      count: n,
    });
    const other: Slot = {
      kind: "flowers",
      species: "tournesol",
      color: "orange",
      quality: "belle",
      count: 5,
    };
    const full = { ...s, inventory: [pile(4), other, other, other, other, other] };
    const r = applyAction(full, cell, "cueillir", { grade: "rate" }, 0, () => 0);
    expect(r.save.inventory[0]).toMatchObject({ count: 5 });
    expect(r.events.some((e) => e.kind === "graine")).toBe(false);
  });

  it("range une belle fleur comme ordinaire faute de place", () => {
    let s = equipped();
    s = act(act(s, cell, BECHE), cell, SEEDS);
    s = advanceGarden(s, 3_600_000);
    const c = s.cells[first.key];
    if (c.kind !== "plante") throw new Error();
    const other: Slot = {
      kind: "flowers",
      species: "tournesol",
      color: "orange",
      quality: "belle",
      count: 5,
    };
    const plain: Slot = {
      kind: "flowers",
      species: c.seed.species,
      color: c.seed.color,
      quality: "ordinaire",
      count: 3,
    };
    const full = { ...s, inventory: [plain, other, other, other, other, other] };
    const r = applyAction(full, cell, "cueillir", { grade: "parfait" }, 0, never);
    expect(r.save.inventory[0]).toMatchObject({ quality: "ordinaire", count: 4 });
    expect(r.save.cells[first.key]).toEqual({ kind: "herbe" });
  });

  it("ne fait rien si la case a changé pendant le mini-jeu", () => {
    const s = equipped();
    const r = applyAction(s, cell, "semer", { grade: "parfait" }, 0, never);
    expect(r.save).toBe(s);
    expect(r.events).toEqual([]);
  });

  it("ne vide jamais l'arrosoir en le remplissant mal", () => {
    const s = { ...equipped(), inventory: setWater(equipped().inventory, 4) };
    const r = applyAction(
      s,
      { kind: "puits" },
      "puits",
      { grade: "rate", water: 0.1 },
      ARROSOIR,
      never,
    );
    expect(waterLeft(r.save.inventory)).toBe(4);
  });

  it("remplit l'arrosoir au puits selon l'eau restante", () => {
    const s = { ...equipped(), inventory: setWater(equipped().inventory, 0) };
    const p = prepareAction(s, { kind: "puits" }, ARROSOIR);
    expect(p).toEqual({ gesture: "puits" });
    const r = applyAction(
      s,
      { kind: "puits" },
      "puits",
      { grade: "bien", water: 0.7 },
      ARROSOIR,
      never,
    );
    expect(waterLeft(r.save.inventory)).toBe(4);
    const low = applyAction(
      s,
      { kind: "puits" },
      "puits",
      { grade: "rate", water: 0 },
      ARROSOIR,
      never,
    );
    expect(waterLeft(low.save.inventory)).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import type { Seed } from "../../core/types";
import {
  bestRarity,
  FLIP_MS,
  IDLE,
  initialPhase,
  lockFor,
  REVEAL_FX,
  stackOf,
  step,
  tearProgress,
  type Phase,
} from "./packFlow";

const seed = (rarity: Seed["rarity"]): Seed => ({ species: "cosmos", color: "pink", rarity });

describe("step", () => {
  it("déroule repos, déchirure, révélation carte par carte, récapitulatif", () => {
    let p: Phase = IDLE;
    p = step(p, "startTear", 3);
    expect(p).toEqual({ kind: "tearing" });
    p = step(p, "tear", 3);
    expect(p).toEqual({ kind: "revealing", current: -1 });
    p = step(p, "next", 3);
    p = step(p, "next", 3);
    p = step(p, "next", 3);
    expect(p).toEqual({ kind: "revealing", current: 2 });
    p = step(p, "next", 3);
    expect(p).toEqual({ kind: "summary" });
    expect(step(p, "reset", 3)).toBe(IDLE);
  });

  it("Tout révéler saute au récapitulatif", () => {
    expect(step({ kind: "revealing", current: 0 }, "revealAll", 3)).toEqual({ kind: "summary" });
  });

  it("startTear en pleine déchirure ne change rien", () => {
    const tearing: Phase = { kind: "tearing" };
    expect(step(tearing, "startTear", 3)).toBe(tearing);
  });

  it("ignore les événements hors phase", () => {
    expect(step(IDLE, "next", 3)).toBe(IDLE);
    expect(step(IDLE, "tear", 3)).toBe(IDLE);
    const summary: Phase = { kind: "summary" };
    expect(step(summary, "next", 3)).toBe(summary);
  });
});

describe("initialPhase", () => {
  it("reprend au récapitulatif un lot pas vu jusqu'au bout", () => {
    expect(initialPhase(4, 3)).toEqual({ kind: "summary" });
  });

  it("repart au repos sinon", () => {
    expect(initialPhase(0, 0)).toBe(IDLE);
    expect(initialPhase(4, 4)).toBe(IDLE);
  });
});

describe("stackOf", () => {
  it("au repos, le premier sachet en attente est dessus", () => {
    expect(stackOf(IDLE, ["dore", "quotidien"], "famille")).toEqual({
      top: "dore",
      under: ["quotidien"],
    });
  });

  it("pendant la déchirure, le sachet déjà consommé reste dessus", () => {
    expect(stackOf({ kind: "tearing" }, ["quotidien"], "dore")).toEqual({
      top: "dore",
      under: ["quotidien"],
    });
    expect(stackOf({ kind: "tearing" }, [], "quotidien")).toEqual({
      top: "quotidien",
      under: [],
    });
  });

  it("plus de sachet : rien dessus", () => {
    expect(stackOf(IDLE, [], "quotidien")).toEqual({ top: null, under: [] });
  });
});

describe("réglages", () => {
  it("bestRarity garde la plus haute rareté", () => {
    expect(bestRarity([seed("commune"), seed("epique"), seed("rare")])).toBe("epique");
    expect(bestRarity([])).toBe("commune");
  });

  it("les effets grandissent avec la rareté", () => {
    expect(REVEAL_FX.commune).toEqual({ hold: 0, shake: 0, burst: null });
    expect(REVEAL_FX.rare.burst).toBe("sparks");
    expect(REVEAL_FX.epique).toEqual({ hold: 300, shake: 4, burst: "rays" });
    expect(REVEAL_FX.legendaire).toEqual({ hold: 900, shake: 10, burst: "gold" });
  });

  it("une légendaire verrouille le paquet jusqu'à la fin de son retournement", () => {
    expect(lockFor("commune")).toBe(FLIP_MS);
    expect(lockFor("legendaire")).toBe(900 + FLIP_MS);
  });

  it("tearProgress est borné entre 0 et 1", () => {
    expect(tearProgress(70, 100)).toBe(0.7);
    expect(tearProgress(-20, 100)).toBe(0);
    expect(tearProgress(300, 100)).toBe(1);
    expect(tearProgress(10, 0)).toBe(0);
  });
});

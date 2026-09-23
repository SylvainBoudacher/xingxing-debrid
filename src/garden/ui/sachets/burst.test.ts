import { describe, expect, it } from "vitest";
import { emit, isIdle, MAX_PARTICLES, newBurst, stepBurst, type BurstKind } from "./burst";

const rng = () => 0.5;

describe("burst", () => {
  it("chaque type émet son nombre de particules", () => {
    const counts: [BurstKind, number][] = [
      ["paper", 36],
      ["sparks", 24],
      ["rays", 28],
      ["gold", 90],
    ];
    for (const [kind, n] of counts) {
      const b = newBurst();
      emit(b, kind, 0, 0, rng);
      expect(b.parts).toHaveLength(n);
    }
  });

  it("plafonne le nombre de particules", () => {
    const b = newBurst();
    emit(b, "gold", 0, 0, rng);
    emit(b, "gold", 0, 0, rng);
    expect(b.parts).toHaveLength(MAX_PARTICLES);
  });

  it("les épiques ajoutent des rayons, les légendaires des rayons et un flash", () => {
    const rays = newBurst();
    emit(rays, "rays", 10, 20, rng);
    expect(rays.rays).toHaveLength(1);
    expect(rays.flash).toBe(0);
    const gold = newBurst();
    emit(gold, "gold", 10, 20, rng);
    expect(gold.rays).toHaveLength(1);
    expect(gold.flash).toBe(1);
  });

  it("tout s'éteint en fin de vie", () => {
    const b = newBurst();
    emit(b, "gold", 0, 0, rng);
    expect(isIdle(b)).toBe(false);
    for (let i = 0; i < 60; i++) stepBurst(b, 0.05);
    expect(isIdle(b)).toBe(true);
  });

  it("les confettis retombent", () => {
    const b = newBurst();
    emit(b, "paper", 0, 0, rng);
    for (let i = 0; i < 10; i++) stepBurst(b, 0.08);
    expect(b.parts[0].y).toBeGreaterThan(0);
  });
});

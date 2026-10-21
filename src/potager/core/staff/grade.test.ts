import { describe, expect, it } from "vitest";
import { AVATAR_SPEED } from "../avatarMotion";
import { seededRng } from "../seeds";
import { gestureMs, rollStaffGrade, staffSpeed } from "./grade";

describe("note des employés", () => {
  it("n'est jamais Parfait", () => {
    const rng = seededRng(3);
    for (const level of [1, 2, 3, 4, 5] as const)
      for (let i = 0; i < 1000; i++) expect(rollStaffGrade(level, rng)).not.toBe("parfait");
  });

  it("est toujours Bien au niveau 5", () => {
    expect(rollStaffGrade(5, () => 0.999)).toBe("bien");
  });

  it("donne Bien à 40 % au niveau 1", () => {
    expect(rollStaffGrade(1, () => 0.39)).toBe("bien");
    expect(rollStaffGrade(1, () => 0.41)).toBe("rate");
  });

  it("règle vitesse et durée du geste sur le niveau", () => {
    expect(staffSpeed(1)).toBeCloseTo(0.6 * AVATAR_SPEED);
    expect(staffSpeed(5)).toBeCloseTo(AVATAR_SPEED);
    expect(gestureMs(1)).toBe(3000);
    expect(gestureMs(5)).toBe(1200);
  });
});

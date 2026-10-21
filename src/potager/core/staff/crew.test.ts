import { describe, expect, it } from "vitest";
import type { Cell, PotagerSave } from "../types";
import { advanceStaff } from "./crew";
import { hired, P0, plant, seedOf, village } from "./testkit";

const STEP = 1000;
const rng = () => 0.3;
const [seed] = seedOf("commune");

const run = (
  s: PotagerSave,
  steps: number,
  stepMs = STEP,
  between?: (s: PotagerSave) => PotagerSave,
) => {
  for (let i = 0; i < steps; i++) {
    s = advanceStaff(s, stepMs, rng);
    s = { ...s, playTimeMs: s.playTimeMs + stepMs };
    if (between) s = between(s);
  }
  return s;
};
const dry = (keys: string[], extra: Partial<Extract<Cell, { kind: "plante" }>> = {}) => {
  const cells = { ...village().cells };
  for (const k of keys) cells[k] = plant(seed, extra);
  return cells;
};
const isWet = (s: PotagerSave, k: string) => {
  const c = s.cells[k];
  return c.kind === "plante" && c.wetUntil > s.playTimeMs;
};

describe("arroseur", () => {
  it("ne touche à rien sans parcelle confiée", () => {
    const s = village({
      cells: dry(P0.slice(0, 2)),
      staff: { arroseur: hired(1, { parcels: [] }) },
    });
    const out = run(s, 30);
    expect(out.cells).toEqual(s.cells);
    expect(out.crew.arroseur?.status).toEqual({ kind: "idle" });
  });

  it("arrose les plantes sèches de sa parcelle, jamais en Parfait", () => {
    const s = village({ cells: dry(P0.slice(0, 2)), staff: { arroseur: hired() } });
    const out = run(s, 40);
    for (const k of P0.slice(0, 2)) {
      expect(isWet(out, k)).toBe(true);
      const c = out.cells[k];
      expect(c.kind === "plante" && c.wetGrade).not.toBe("parfait");
    }
    expect(out.inventory).toEqual(s.inventory);
  });

  it("n'arrose pas une fleur épanouie", () => {
    const s = village({ cells: dry([P0[0]], { progress: 1 }), staff: { arroseur: hired() } });
    expect(run(s, 30).cells).toEqual(s.cells);
  });

  it("retourne au puits après cinq arrosages", () => {
    const s = village({ cells: dry(P0.slice(0, 6)), staff: { arroseur: hired(5) } });
    let sawPuits = false;
    const out = run(s, 80, STEP, (x) => {
      if (x.crew.arroseur?.task?.gesture === "remplir") sawPuits = true;
      return x;
    });
    expect(sawPuits).toBe(true);
    expect(P0.slice(0, 6).every((k) => isWet(out, k))).toBe(true);
  });

  it("va plus vite au niveau 5", () => {
    const steps = (level: 1 | 5) => {
      let s = village({ cells: dry([P0[0]]), staff: { arroseur: hired(level) } });
      for (let i = 1; i < 60; i++) {
        s = run(s, 1);
        if (isWet(s, P0[0])) return i;
      }
      return Infinity;
    };
    expect(steps(5)).toBeLessThan(steps(1));
  });

  it("laisse la case au joueur pendant son mini-jeu", () => {
    const s = village({ cells: dry([P0[0]]), staff: { arroseur: hired() } });
    const out = run(s, 40, STEP, (x) => ({ ...x, playerBusy: P0[0] }));
    expect(isWet(out, P0[0])).toBe(false);
    expect(out.crew.arroseur?.water).toBe(5);
  });

  it("abandonne une case arrosée entre-temps par le joueur", () => {
    const s = village({ cells: dry(P0.slice(0, 2)), staff: { arroseur: hired() } });
    let target: string | undefined;
    const out = run(s, 40, STEP, (x) => {
      const t = x.crew.arroseur?.task;
      if (!target && t?.gesture === "arroser") {
        target = t.cell;
        const c = x.cells[t.cell!];
        if (c.kind === "plante")
          return {
            ...x,
            cells: {
              ...x.cells,
              [t.cell!]: { ...c, wetUntil: x.playTimeMs + 999_999, wetGrade: "parfait" },
            },
          };
      }
      return x;
    });
    const c = out.cells[target!];
    expect(c.kind === "plante" && c.wetGrade).toBe("parfait");
    expect(P0.slice(0, 2).every((k) => isWet(out, k))).toBe(true);
  });

  it("lâche une parcelle décochée", () => {
    const s = village({ cells: dry(P0.slice(0, 3)), staff: { arroseur: hired() } });
    const out = run(s, 40, STEP, (x) =>
      x.crew.arroseur?.task?.gesture === "arroser"
        ? { ...x, staff: { arroseur: hired(1, { parcels: [] }) } }
        : x,
    );
    expect(P0.slice(0, 3).some((k) => isWet(out, k))).toBe(false);
    expect(out.crew.arroseur?.task).toBeNull();
  });

  it("enchaîne les tâches d'un grand pas sans arroser deux fois", () => {
    const s = village({ cells: dry(P0.slice(0, 4)), staff: { arroseur: hired() } });
    const out = run(s, 1, 600_000);
    // chaque arrosage est daté du moment où il a lieu dans le pas
    const stamps = P0.slice(0, 4).map((k) => {
      const c = out.cells[k];
      return c.kind === "plante" ? c.wetUntil : 0;
    });
    expect(stamps.every((t) => t > s.playTimeMs)).toBe(true);
    expect(new Set(stamps).size).toBe(4);
    expect(out.crew.arroseur?.water).toBe(1);
  });
});

describe("le joueur passe avant", () => {
  it("l'arroseur arrose les autres cases pendant le mini-jeu du joueur", () => {
    const s = village({ cells: dry(P0.slice(0, 4)), staff: { arroseur: hired() } });
    const nearest = run(s, 1).crew.arroseur!.task!.cell!;
    const out = run(s, 60, STEP, (x) => ({ ...x, playerBusy: nearest }));
    expect(isWet(out, nearest)).toBe(false);
    expect(
      P0.slice(0, 4)
        .filter((k) => k !== nearest)
        .every((k) => isWet(out, k)),
    ).toBe(true);
  });
});

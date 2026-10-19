import { describe, expect, it } from "vitest";
import { seededRng } from "../seeds";
import { createArroser } from "./arroser";
import { createBecher } from "./becher";
import { createCueillir } from "./cueillir";
import { createPuits } from "./puits";
import { createSemer } from "./semer";
import type { Input, Minigame } from "./types";

const DT = 1 / 60;

function run<V>(g: Minigame<V>, maxS: number, onFrame: (v: V, t: number) => void = () => {}) {
  for (let t = 0; t < maxS && !g.result(); t += DT) {
    onFrame(g.view(), t);
    g.update(DT);
  }
  return g.result();
}
const tap = <V>(g: Minigame<V>, i: Input) => {
  g.press(i, true);
  g.press(i, false);
};

describe("bêcher", () => {
  it("parfait en frappant pile sur l'anneau", () => {
    const g = createBecher();
    const r = run(g, 6, (v) => {
      if (v.active && Math.abs(v.radius - v.target) < 0.5) tap(g, "action");
    });
    expect(r?.grade).toBe("parfait");
  });

  it("raté sans aucun coup, en environ 4 s", () => {
    const g = createBecher();
    expect(run(g, 4.5)?.grade).toBe("rate");
  });
});

describe("semer", () => {
  const sowAt = (offset: number) => {
    const g = createSemer(seededRng(5));
    return run(g, 8, (v) => {
      if (Math.abs(v.x - (v.hole + offset)) < 1.5) tap(g, "action");
    })?.grade;
  };
  it("note selon l'écart au trou", () => {
    expect(sowAt(0)).toBe("parfait");
    expect(sowAt(30)).toBe("bien");
    expect(sowAt(60)).toBe("rate");
  });
});

describe("arroser", () => {
  const pourTo = (level: number) => {
    const g = createArroser();
    g.press("action", true);
    return run(g, 3, (v) => {
      if (v.level >= level) g.press("action", false);
    })?.grade;
  };
  it("note selon le niveau au relâché", () => {
    expect(pourTo(0.7)).toBe("parfait");
    expect(pourTo(0.65)).toBe("bien");
    expect(pourTo(0.4)).toBe("rate");
  });

  it("finit seul si on ne relâche jamais", () => {
    const g = createArroser();
    g.press("action", true);
    expect(run(g, 1.8)?.grade).toBe("rate");
  });
});

describe("cueillir", () => {
  it("parfait avec la bonne séquence immédiate", () => {
    const g = createCueillir(seededRng(2));
    for (const k of g.view().sequence) tap(g, k);
    expect(g.result()?.grade).toBe("parfait");
  });

  it("bien après une erreur", () => {
    const g = createCueillir(seededRng(2));
    const seq = g.view().sequence;
    tap(g, seq[0] === "up" ? "down" : "up");
    for (const k of seq) tap(g, k);
    expect(g.result()?.grade).toBe("bien");
  });

  it("raté à la fin du temps", () => {
    expect(run(createCueillir(seededRng(2)), 2.6)?.grade).toBe("rate");
  });
});

describe("puits", () => {
  it("rend une part d'eau même sans rien faire", () => {
    const r = run(createPuits(), 3.6);
    expect(r).not.toBeNull();
    expect(r!.water).toBeGreaterThanOrEqual(0);
    expect(r!.water).toBeLessThanOrEqual(1);
  });

  it("parfait en compensant toujours le tangage", () => {
    const g = createPuits();
    let held: Input | null = null;
    const r = run(g, 3.6, (v) => {
      const want: Input = v.angle > 0 ? "right" : "left";
      if (held !== want) {
        if (held) g.press(held, false);
        g.press(want, true);
        held = want;
      }
    });
    expect(r?.grade).toBe("parfait");
  });
});

import { describe, expect, it } from "vitest";
import { backdropMode } from "./backdropMode";

const base = { active: true, focused: true, hidden: false };

describe("backdropMode", () => {
  it("tourne quand tout est visible", () => {
    expect(backdropMode(base)).toBe("run");
  });

  it("se met en pause si la page masque le fond, le focus est perdu ou l'onglet caché", () => {
    expect(backdropMode({ ...base, active: false })).toBe("pause");
    expect(backdropMode({ ...base, focused: false })).toBe("pause");
    expect(backdropMode({ ...base, hidden: true })).toBe("pause");
  });
});

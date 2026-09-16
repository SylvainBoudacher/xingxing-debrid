import { describe, expect, it } from "vitest";
import { backdropMode } from "./backdropMode";

const base = { active: true, focused: true, hidden: false, gardenOpen: false };

describe("backdropMode", () => {
  it("tourne quand tout est visible", () => {
    expect(backdropMode(base)).toBe("run");
  });

  it("se met en pause si la page masque le fond, le focus est perdu ou l'onglet caché", () => {
    expect(backdropMode({ ...base, active: false })).toBe("pause");
    expect(backdropMode({ ...base, focused: false })).toBe("pause");
    expect(backdropMode({ ...base, hidden: true })).toBe("pause");
  });

  it("se fige quand le Potager est ouvert, quoi qu'il arrive", () => {
    expect(backdropMode({ ...base, gardenOpen: true })).toBe("frozen");
    expect(backdropMode({ active: false, focused: false, hidden: true, gardenOpen: true })).toBe(
      "frozen",
    );
  });
});

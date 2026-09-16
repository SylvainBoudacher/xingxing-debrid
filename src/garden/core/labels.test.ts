import { describe, expect, it } from "vitest";
import {
  flowerName,
  formatDuration,
  pickedWord,
  pressedLabel,
  RARITY_FR,
  STAGE_FR,
  VARIANT_FR,
} from "./labels";
import { HOUR } from "./time";

describe("flowerName", () => {
  it("accorde la couleur au genre de l'espèce", () => {
    expect(flowerName({ species: "cosmos", color: "white" })).toBe("Cosmos blanc");
    expect(flowerName({ species: "rosetremiere", color: "white" })).toBe("Rose trémière blanche");
    expect(flowerName({ species: "bruyere", color: "violet" })).toBe("Bruyère violette");
    expect(flowerName({ species: "dahlia", color: "heather" })).toBe("Dahlia pourpre");
  });

  it("accorde les nouvelles espèces et couleurs", () => {
    expect(flowerName({ species: "anemone", color: "white" })).toBe("Anémone du Japon blanche");
    expect(flowerName({ species: "vergedor", color: "orange" })).toBe("Verge d'or orange");
    expect(flowerName({ species: "lanternelune", color: "blue" })).toBe("Lanterne-de-lune bleue");
    expect(flowerName({ species: "sedum", color: "lime" })).toBe("Sedum vert");
    expect(flowerName({ species: "rosetremiere", color: "black" })).toBe("Rose trémière noire");
  });

  it("pickedWord suit le genre", () => {
    expect(pickedWord("cosmos")).toBe("cueilli");
    expect(pickedWord("bruyere")).toBe("cueillie");
  });
});

describe("formatDuration", () => {
  it("minutes, heures pleines, heures et minutes", () => {
    expect(formatDuration(0)).toBe("1 min");
    expect(formatDuration(20 * 60_000)).toBe("20 min");
    expect(formatDuration(3 * HOUR)).toBe("3 h");
    expect(formatDuration(HOUR + 5 * 60_000)).toBe("1 h 05");
    expect(formatDuration(HOUR + 20 * 60_000 + 1)).toBe("1 h 21");
  });
});

describe("tables", () => {
  it("raretés et étapes accentuées", () => {
    expect(RARITY_FR.epique).toBe("Épique");
    expect(RARITY_FR.legendaire).toBe("Légendaire");
    expect(STAGE_FR[2]).toBe("Jeune plant");
    expect(STAGE_FR[4]).toBe("En fleur");
  });
});

describe("herbier", () => {
  it("pressedLabel accorde le nombre", () => {
    expect(pressedLabel(1)).toBe("1 pressée");
    expect(pressedLabel(3)).toBe("3 pressées");
  });

  it("noms des variantes", () => {
    expect(VARIANT_FR).toEqual({ givree: "Givrée", doree: "Dorée", lumineuse: "Lumineuse" });
  });
});

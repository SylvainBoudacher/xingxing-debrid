import { describe, expect, it } from "vitest";
import { flowerName, formatDuration, pickedWord, RARITY_FR, STAGE_FR } from "./labels";
import { HOUR } from "./time";

describe("flowerName", () => {
  it("accorde la couleur au genre de l'espèce", () => {
    expect(flowerName({ species: "cosmos", color: "white" })).toBe("Cosmos blanc");
    expect(flowerName({ species: "rosetremiere", color: "white" })).toBe("Rose trémière blanche");
    expect(flowerName({ species: "bruyere", color: "violet" })).toBe("Bruyère violette");
    expect(flowerName({ species: "dahlia", color: "heather" })).toBe("Dahlia pourpre");
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

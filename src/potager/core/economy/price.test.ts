import { describe, expect, it } from "vitest";
import type { Demand } from "../types";
import { salePrice } from "./price";

const demand = (species: Demand["species"], color: Demand["color"]): Demand => ({
  species,
  color,
});

describe("salePrice", () => {
  it("commune belle, demande exacte, ruban parfait", () => {
    expect(
      salePrice(
        { species: "dahlia", color: "red", quality: "belle" },
        demand("dahlia", "red"),
        "parfait",
      ),
    ).toBe(14);
  });
  it("commune ordinaire, demande sans rapport, raté", () => {
    expect(
      salePrice(
        { species: "dahlia", color: "red", quality: "ordinaire" },
        demand("tournesol", "yellow"),
        "rate",
      ),
    ).toBe(5);
  });
  it("bonne couleur seule, bien", () => {
    expect(
      salePrice(
        { species: "dahlia", color: "red", quality: "ordinaire" },
        demand("cosmos", "red"),
        "bien",
      ),
    ).toBe(7);
  });
  it("légendaire belle, double bonus, parfait", () => {
    expect(
      salePrice(
        { species: "tournesol", color: "white", quality: "belle" },
        demand("tournesol", "white"),
        "parfait",
      ),
    ).toBe(270);
  });
  it("rare, épique selon la rareté de la fleur", () => {
    expect(
      salePrice(
        { species: "rosetremiere", color: "red", quality: "ordinaire" },
        demand("aster", "violet"),
        "rate",
      ),
    ).toBe(15);
    expect(
      salePrice(
        { species: "tournesol", color: "burgundy", quality: "ordinaire" },
        demand("aster", "violet"),
        "rate",
      ),
    ).toBe(40);
  });
});

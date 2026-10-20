import { describe, expect, it } from "vitest";
import type { FlowerStack } from "../core/types";
import { demandLabel, matchLabel } from "./demandLabel";

const pile = (species: FlowerStack["species"], color: FlowerStack["color"]): FlowerStack => ({
  kind: "flowers",
  species,
  color,
  quality: "belle",
  count: 1,
});

describe("demandLabel", () => {
  it("accorde l'article et la couleur au genre de l'espèce", () => {
    expect(demandLabel({ species: "tournesol", color: "yellow" })).toBe("Un Tournesol jaune");
    expect(demandLabel({ species: "rosetremiere", color: "white" })).toBe(
      "Une Rose trémière blanche",
    );
  });

  it("signale l'espèce, la couleur ou les deux", () => {
    const d = { species: "tournesol", color: "yellow" } as const;
    expect(matchLabel(pile("tournesol", "yellow"), d)).toBe("Double bonus");
    expect(matchLabel(pile("tournesol", "red"), d)).toBe("Bonne espèce");
    expect(matchLabel(pile("rosetremiere", "yellow"), d)).toBe("Bonne couleur");
    expect(matchLabel(pile("rosetremiere", "red"), d)).toBeNull();
  });
});

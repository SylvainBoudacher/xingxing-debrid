import { describe, expect, it } from "vitest";
import type { Seed } from "../../core/types";
import { delays, revealDuration } from "./reveal";

const seed = (rarity: Seed["rarity"]): Seed => ({ species: "cosmos", color: "pink", rarity });

describe("delays", () => {
  it("retourne les cartes toutes les 350 ms", () => {
    expect(delays([seed("commune"), seed("rare"), seed("epique")])).toEqual([0, 350, 700]);
  });

  it("une légendaire retient la carte suivante", () => {
    expect(delays([seed("legendaire"), seed("commune"), seed("commune")])).toEqual([0, 1350, 1700]);
    expect(delays([seed("commune"), seed("legendaire"), seed("commune")])).toEqual([0, 350, 1700]);
  });

  it("la durée totale couvre la dernière carte", () => {
    expect(revealDuration([])).toBe(350);
    expect(revealDuration([seed("commune"), seed("legendaire")])).toBe(700);
  });
});

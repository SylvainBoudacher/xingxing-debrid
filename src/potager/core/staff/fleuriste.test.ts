import { describe, expect, it } from "vitest";
import { salePrice } from "../economy/price";
import type { FlowerStack, PotagerSave } from "../types";
import { advanceStaff } from "./crew";
import { pickStallFlower } from "./fleuriste";
import { hired, village } from "./testkit";

const pile = (
  species: string,
  color: string,
  quality: "belle" | "ordinaire" = "ordinaire",
): FlowerStack => ({ kind: "flowers", species, color, quality, count: 1 }) as FlowerStack;
const run = (s: PotagerSave, steps: number, busy: string | null = null) => {
  for (let i = 0; i < steps; i++) {
    s = advanceStaff({ ...s, playerBusy: busy }, 1000, () => 0.999);
    s = { ...s, playTimeMs: s.playTimeMs + 1000 };
  }
  return s;
};

describe("choix de la fleur", () => {
  it("prend celle qui touche le plus de bonus", () => {
    const stall = [pile("cosmos", "red"), pile("rosetremiere", "red"), pile("dahlia", "red")];
    expect(pickStallFlower(stall, { species: "rosetremiere", color: "red" })).toBe(1);
  });

  it("sans bonus, vend la moins rare et l'ordinaire avant la belle", () => {
    const legend = pile("lanternelune", "blue");
    const stall = [legend, pile("tournesol", "yellow", "belle"), pile("tournesol", "yellow")];
    expect(pickStallFlower(stall, { species: "rosetremiere", color: "red" })).toBe(2);
  });
});

describe("fleuriste", () => {
  const stall = [pile("tournesol", "yellow")];
  const demand = { species: "tournesol" as const, color: "yellow" as const };
  const open = (active: boolean) =>
    village({
      stall,
      client: { demand, look: 0 },
      staff: { fleuriste: hired(1, { parcels: [], active }) },
    });

  it("sert le client et touche le prix de la vente", () => {
    const out = run(open(true), 60);
    expect(out.client).toBeNull();
    expect(out.stall).toEqual([]);
    expect([salePrice(stall[0], demand, "bien"), salePrice(stall[0], demand, "rate")]).toContain(
      out.po,
    );
  });

  it("ne sert pas en pause", () => {
    const out = run(open(false), 60);
    expect(out.client).not.toBeNull();
    expect(out.po).toBe(0);
    expect(out.crew.fleuriste?.status).toEqual({ kind: "pause" });
  });

  it("laisse servir le joueur qui joue le ruban", () => {
    const out = run(open(true), 60, "etal");
    expect(out.client).not.toBeNull();
  });
});

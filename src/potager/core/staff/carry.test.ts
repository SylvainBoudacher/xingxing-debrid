import { describe, expect, it } from "vitest";
import { CHEST_SIZES } from "../economy/catalog";
import type { ChestStack, FlowerStack } from "../types";
import { dropCarry, takeSeeds } from "./carry";
import { seedOf, village } from "./testkit";

const rose = (count: number): FlowerStack => ({
  kind: "flowers",
  species: "rosetremiere",
  color: "red",
  quality: "ordinaire",
  count,
});
const fillers = (n: number): ChestStack[] =>
  Array.from({ length: n }, (_, i) => ({
    kind: "seeds",
    rarity: "epique",
    seeds: seedOf("epique", 1 + i),
  }));

describe("dépôt au coffre", () => {
  it("fusionne avec une pile identique même coffre plein", () => {
    const chest = [...fillers(CHEST_SIZES[0] - 1), rose(2)];
    const { save, left } = dropCarry(village({ chest }), { seeds: [], flowers: [rose(5)] });
    expect(left).toEqual({ seeds: [], flowers: [] });
    expect(save.chest[CHEST_SIZES[0] - 1]).toEqual(rose(7));
  });

  it("garde ce qui ne trouve pas de place", () => {
    const chest = fillers(CHEST_SIZES[0]);
    const s = village({ chest });
    const { save, left } = dropCarry(s, { seeds: [], flowers: [rose(5)] });
    expect(left.flowers).toEqual([rose(5)]);
    expect(save.chest).toEqual(chest);
  });
});

describe("graines prises au coffre", () => {
  it("ne prend rien au-dessus de la rareté permise", () => {
    const s = village({ chest: [{ kind: "seeds", rarity: "rare", seeds: seedOf("rare", 2) }] });
    expect(takeSeeds(s, "commune")).toBeNull();
    expect(takeSeeds(s, "rare")?.carry.seeds).toHaveLength(2);
  });

  it("prend les communes d'abord, cinq au plus", () => {
    const s = village({
      chest: [
        { kind: "seeds", rarity: "rare", seeds: seedOf("rare", 3) },
        { kind: "seeds", rarity: "commune", seeds: seedOf("commune", 7) },
      ],
    });
    const r = takeSeeds(s, "legendaire")!;
    expect(r.carry.seeds).toHaveLength(5);
    expect(r.carry.seeds.every((x) => x.rarity === "commune")).toBe(true);
    const left = r.save.chest.find((c) => c.kind === "seeds" && c.rarity === "commune");
    expect(left?.kind === "seeds" && left.seeds).toHaveLength(2);
    expect(r.save.inventory).toEqual(s.inventory);
  });
});

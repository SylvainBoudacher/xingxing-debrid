import { describe, expect, it } from "vitest";
import {
  addFlower,
  addSeed,
  deposit,
  hasTool,
  setWater,
  slotView,
  takeSeed,
  withdrawStack,
  withdrawTool,
} from "./inventory";
import { createStarterSave } from "./save";
import { rollSeed, seededRng } from "./seeds";
import type { FlowerStack, Slot } from "./types";

const rng = seededRng(7);
const common = () => rollSeed("commune", rng);
const empty = (): (Slot | null)[] => Array(6).fill(null);
const tournesol = { species: "tournesol", color: "yellow", quality: "ordinaire" } as const;

describe("inventaire", () => {
  it("empile les graines par 5 et par rareté", () => {
    let inv = empty();
    for (let i = 0; i < 6; i++) inv = addSeed(inv, common())!;
    inv = addSeed(inv, rollSeed("rare", rng))!;
    expect(inv.filter(Boolean)).toHaveLength(3);
    expect(inv[2]).toMatchObject({ kind: "seeds", rarity: "rare" });
  });

  it("refuse quand le sac est plein", () => {
    const full: (Slot | null)[] = Array.from({ length: 6 }, () => ({
      kind: "flowers",
      ...tournesol,
      color: "orange",
      count: 5,
    }));
    expect(addSeed(full, common())).toBeNull();
    expect(addFlower(full, tournesol)).toBeNull();
  });

  it("complète une pile de fleurs identiques", () => {
    const inv = addFlower(addFlower(empty(), tournesol)!, tournesol)!;
    expect(inv[0]).toMatchObject({ kind: "flowers", count: 2 });
  });

  it("vide la case quand on prend la dernière graine", () => {
    const inv = addSeed(empty(), common())!;
    const r = takeSeed(inv, 3)!;
    expect(r.seed.rarity).toBe("commune");
    expect(r.inv[0]).toBeNull();
    expect(takeSeed(r.inv, 0)).toBeNull();
  });

  it("garde le niveau d'eau de l'arrosoir", () => {
    const s = withdrawTool(createStarterSave(), "arrosoir")!;
    expect(hasTool(s.inventory, "arrosoir")).toBe(true);
    expect(s.rack.map((t) => t.id)).toEqual(["beche", "serfouette"]);
    const inv = setWater(s.inventory, 2);
    expect(inv.find((x) => x?.kind === "tool")).toMatchObject({
      tool: { id: "arrosoir", water: 2 },
    });
  });

  it("range un outil au râtelier", () => {
    const s = withdrawTool(createStarterSave(), "beche")!;
    const i = s.inventory.findIndex((x) => x?.kind === "tool");
    const back = deposit(s, i)!;
    expect(back.inventory[i]).toBeNull();
    expect(back.rack.map((t) => t.id)).toContain("beche");
  });

  it("fusionne des graines déposées avec la pile du coffre", () => {
    let s = createStarterSave();
    s = { ...s, chest: [{ kind: "seeds", rarity: "commune", seeds: [common(), common()] }] };
    s = deposit(s, 0)!;
    expect(s.inventory[0]).toBeNull();
    expect(s.chest).toHaveLength(1);
    expect(s.chest[0].kind === "seeds" && s.chest[0].seeds).toHaveLength(7);
  });

  it("reprend 5 graines au plus d'une pile du coffre", () => {
    let s = createStarterSave();
    s = {
      ...s,
      chest: [
        {
          kind: "seeds",
          rarity: "rare",
          seeds: Array.from({ length: 12 }, () => rollSeed("rare", rng)),
        },
      ],
    };
    s = withdrawStack(s, 0)!;
    const pile = s.inventory.find((x) => x?.kind === "seeds" && x.rarity === "rare");
    expect(pile?.kind === "seeds" && pile.seeds).toHaveLength(5);
    expect(s.chest[0].kind === "seeds" && s.chest[0].seeds).toHaveLength(7);
  });

  it("refuse de reprendre sans case libre", () => {
    const s = createStarterSave();
    const full = {
      ...s,
      inventory: Array.from(
        { length: 6 },
        () => ({ kind: "flowers", ...tournesol, count: 1 }) as Slot,
      ),
      chest: [{ kind: "seeds", rarity: "rare", seeds: [rollSeed("rare", rng)] }] as typeof s.chest,
    };
    expect(withdrawStack(full, 0)).toBeNull();
    expect(withdrawTool(full, "beche")).toBeNull();
  });

  it("n'affiche que la rareté d'une pile de graines", () => {
    const pile = {
      kind: "seeds",
      rarity: "rare",
      seeds: [rollSeed("rare", rng), rollSeed("rare", rng)],
    } as Slot;
    const view = JSON.stringify(slotView(pile));
    for (const seed of pile.kind === "seeds" ? pile.seeds : []) {
      expect(view).not.toContain(seed.species);
      expect(view).not.toContain(`"${seed.color}"`);
    }
    expect(slotView(pile)).toMatchObject({ label: "Rare", count: 2 });
  });
});

describe("coffre limité", () => {
  const SPECIES = [
    "tournesol",
    "rosetremiere",
    "dahlia",
    "cosmos",
    "aster",
    "chrysantheme",
    "bruyere",
    "colchique",
    "anemone",
    "sedum",
    "amarante",
    "vergedor",
    "heliopsis",
    "lanternelune",
  ] as const;
  const pile = (i: number): FlowerStack => ({
    kind: "flowers",
    species: SPECIES[i],
    color: "red",
    quality: "belle",
    count: 1,
  });
  const over = () => ({
    ...createStarterSave(),
    chest: SPECIES.map((_, i) => pile(i)),
  });
  it("retire d'un coffre au-dessus de la capacité, refuse une nouvelle pile, fusionne", () => {
    const save = over();
    expect(withdrawStack(save, 0)).not.toBeNull();
    const inventory = [...save.inventory];
    inventory[0] = { ...pile(0), color: "blue" };
    expect(deposit({ ...save, inventory }, 0)).toBeNull();
    inventory[0] = pile(3);
    expect(deposit({ ...save, inventory }, 0)).not.toBeNull();
  });
  it("outil de niveau 2 : libellé", () => {
    expect(slotView({ kind: "tool", tool: { id: "beche", level: 2 } }).label).toBe("Bêche niv. 2");
  });
});

import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS, MAX_LEAVES, spawnLeaves } from "./leaves";
import { fieldTiles } from "./plots";
import { createStarterSave } from "./starter";
import { DAY, HOUR } from "./time";
import type { GardenSave, TileContent } from "./types";

const SLOT0 = 10_000 * LEAF_SLOT_MS;

function save(
  checkedAt = SLOT0,
  tiles: GardenSave["tiles"] = createStarterSave().tiles,
): GardenSave {
  return { ...createStarterSave(), tiles, leaves: { checkedAt } };
}

const leavesOf = (s: GardenSave) => Object.entries(s.tiles).filter(([, t]) => t?.kind === "leaves");

describe("spawnLeaves", () => {
  it("ne change rien dans le créneau déjà traité", () => {
    const s = save();
    expect(spawnLeaves(s, SLOT0 + HOUR)).toBe(s);
  });

  it("pose un tas au créneau suivant, sur une case libre de la grille", () => {
    const s = save();
    const next = spawnLeaves(s, SLOT0 + LEAF_SLOT_MS + HOUR);
    const found = leavesOf(next);
    expect(found).toHaveLength(1);
    const [key, tile] = found[0];
    expect(fieldTiles(save().plots)).toContain(key);
    expect(s.tiles[key as keyof GardenSave["tiles"]]).toBeUndefined();
    expect(tile).toEqual({ kind: "leaves", since: SLOT0 + LEAF_SLOT_MS });
    expect(next.leaves.checkedAt).toBe(SLOT0 + LEAF_SLOT_MS);
  });

  it("est idempotent", () => {
    const now = SLOT0 + 2 * LEAF_SLOT_MS;
    const once = spawnLeaves(save(), now);
    expect(spawnLeaves(once, now)).toBe(once);
  });

  it("donne le même résultat pour la même sauvegarde", () => {
    const now = SLOT0 + 2 * LEAF_SLOT_MS;
    expect(spawnLeaves(save(), now)).toEqual(spawnLeaves(save(), now));
  });

  it("plafonne à 4 tas après une semaine d'absence", () => {
    const next = spawnLeaves(save(), SLOT0 + 7 * DAY);
    expect(leavesOf(next)).toHaveLength(MAX_LEAVES);
    expect(next.leaves.checkedAt).toBe(SLOT0 + 56 * LEAF_SLOT_MS);
  });

  it("n'ajoute rien quand 4 tas sont déjà là, mais avance le créneau", () => {
    const tiles: GardenSave["tiles"] = {};
    for (const key of ["0,0", "1,0", "2,0", "3,0"] as const)
      tiles[key] = { kind: "leaves", since: 0 };
    const next = spawnLeaves(save(SLOT0, tiles), SLOT0 + LEAF_SLOT_MS);
    expect(leavesOf(next)).toHaveLength(4);
    expect(next.leaves.checkedAt).toBe(SLOT0 + LEAF_SLOT_MS);
  });

  it("choisit la seule case libre", () => {
    const tiles: GardenSave["tiles"] = {};
    const full: TileContent = { kind: "decor", id: "paille" };
    for (const key of fieldTiles(save().plots)) tiles[key] = full;
    delete tiles["5,3"];
    const next = spawnLeaves(save(SLOT0, tiles), SLOT0 + LEAF_SLOT_MS);
    expect(next.tiles["5,3"]).toEqual({ kind: "leaves", since: SLOT0 + LEAF_SLOT_MS });
  });

  it("une sauvegarde sans date examine au plus 4 créneaux", () => {
    const next = spawnLeaves(save(0), SLOT0);
    expect(leavesOf(next)).toHaveLength(MAX_LEAVES);
    expect(next.leaves.checkedAt).toBe(SLOT0);
  });
});

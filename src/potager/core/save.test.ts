import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { createStarterSave, parseSave } from "./save";

describe("sauvegarde du Potager", () => {
  it("crée une partie de départ", () => {
    const s = createStarterSave();
    expect(s.version).toBe(1);
    expect(s.playTimeMs).toBe(0);
    expect(s.buildings).toEqual(["etal", "cabane"]);
    expect(s.parcels).toEqual(["p0"]);
    expect(s.camera.mode).toBe("follow");
  });

  it("relit une sauvegarde valide", () => {
    const s = createStarterSave();
    expect(parseSave(s)).toEqual(s);
  });

  it("refuse une sauvegarde invalide", () => {
    const s = createStarterSave();
    expect(parseSave(null)).toBeNull();
    expect(parseSave("x")).toBeNull();
    expect(parseSave({ ...s, version: 2 })).toBeNull();
    expect(parseSave({ ...s, playTimeMs: "1" })).toBeNull();
    expect(parseSave({ ...s, buildings: ["chateau"] })).toBeNull();
    expect(parseSave({ ...s, camera: { x: 0, z: 0, mode: "orbite" } })).toBeNull();
  });

  it("ignore les champs inconnus", () => {
    expect(parseSave({ ...createStarterSave(), extra: 1 })).not.toHaveProperty("extra");
  });

  it("place l'avatar au point de départ", () => {
    expect(createStarterSave().avatar).toEqual(MAP.spawn);
  });

  it("relit la position de l'avatar", () => {
    expect(parseSave({ ...createStarterSave(), avatar: { x: 3, z: 1 } })?.avatar).toEqual({
      x: 3,
      z: 1,
    });
  });

  it("accepte une ancienne sauvegarde sans avatar", () => {
    const { avatar: _, ...old } = createStarterSave();
    const s = parseSave(old);
    expect(s).not.toBeNull();
    expect(s?.avatar).toEqual(MAP.spawn);
  });

  it("remplace une position d'avatar mal typée par le point de départ", () => {
    expect(parseSave({ ...createStarterSave(), avatar: { x: "a", z: 0 } })?.avatar).toEqual(
      MAP.spawn,
    );
  });

  it("prépare le jardin, l'inventaire et l'abri d'une partie neuve", () => {
    const s = createStarterSave();
    const cells = Object.values(s.cells);
    expect(cells).toHaveLength(18);
    expect(cells.every((c) => c.kind === "herbe")).toBe(true);
    expect(s.inventory).toHaveLength(6);
    expect(s.inventory[0]).toMatchObject({ kind: "seeds", rarity: "commune" });
    expect(s.inventory[0]?.kind === "seeds" && s.inventory[0].seeds).toHaveLength(5);
    expect(s.inventory.slice(1).every((x) => x === null)).toBe(true);
    expect(s.rack.map((t) => t.id)).toEqual(["beche", "arrosoir", "serfouette"]);
    expect(s.rack[1].water).toBe(5);
    expect(s.chest).toEqual([]);
    expect(s.herbier).toEqual({});
  });

  it("complète une sauvegarde d'avant le jardin", () => {
    const {
      cells: _c,
      inventory: _i,
      rack: _r,
      chest: _h,
      herbier: _e,
      ...old
    } = {
      ...createStarterSave(),
      avatar: { x: 3, z: 1 },
    };
    const s = parseSave(old);
    expect(s).not.toBeNull();
    expect(s?.avatar).toEqual({ x: 3, z: 1 });
    expect(Object.keys(s!.cells)).toHaveLength(18);
    expect(s?.rack).toHaveLength(3);
  });

  it("remplace un inventaire mal formé par celui de départ", () => {
    const s = parseSave({ ...createStarterSave(), inventory: "x" });
    expect(s?.inventory).toEqual(createStarterSave().inventory);
  });

  it("remet en herbe une case invalide", () => {
    const start = createStarterSave();
    const key = Object.keys(start.cells)[0];
    const s = parseSave({
      ...start,
      cells: { ...start.cells, [key]: { kind: "plante", progress: 5 } },
    });
    expect(s?.cells[key]).toEqual({ kind: "herbe" });
  });
});

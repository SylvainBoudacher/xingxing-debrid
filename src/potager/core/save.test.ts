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

  it("démarre sans gêneurs ni objets de forêt", () => {
    const s = createStarterSave();
    expect([s.weeds, s.crows, s.forest]).toEqual([{}, {}, {}]);
    const { weeds: _w, crows: _c, forest: _f, ...old } = s;
    const r = parseSave(old);
    expect([r?.weeds, r?.crows, r?.forest]).toEqual([{}, {}, {}]);
    expect(parseSave({ ...s, forest: { 99: "gland", 0: "truffe" } })?.forest).toEqual({});
  });

  it("ne perd jamais un outil d'une sauvegarde abîmée", () => {
    const s = createStarterSave();
    const r = parseSave({
      ...s,
      inventory: "x",
      rack: [{ id: "arrosoir", water: 2 }, { id: "serfouette" }],
    });
    expect(r?.rack.map((t) => t.id).sort()).toEqual(["arrosoir", "beche", "serfouette"]);
  });

  it("garde les outils sains du râtelier quand une entrée est abîmée", () => {
    const s = createStarterSave();
    const r = parseSave({
      ...s,
      rack: [{ id: "beche" }, { id: "arrosoir", water: 2 }, "x"],
    });
    expect(r?.rack.find((t) => t.id === "arrosoir")?.water).toBe(2);
  });

  it("ne double jamais un outil", () => {
    const s = createStarterSave();
    const inventory = [...s.inventory];
    inventory[1] = { kind: "tool", tool: { id: "beche" } };
    const r = parseSave({ ...s, inventory });
    const all = [
      ...r!.rack.map((t) => t.id),
      ...r!.inventory.flatMap((x) => (x?.kind === "tool" ? [x.tool.id] : [])),
    ];
    expect(all.filter((id) => id === "beche")).toHaveLength(1);
    expect(r?.inventory[1]).toMatchObject({ kind: "tool", tool: { id: "beche" } });
  });

  it("ne garde qu'un exemplaire d'un outil présent deux fois dans le sac", () => {
    const s = createStarterSave();
    const inventory = [...s.inventory];
    inventory[1] = { kind: "tool", tool: { id: "beche" } };
    inventory[2] = { kind: "tool", tool: { id: "beche" } };
    const r = parseSave({ ...s, inventory })!;
    const all = [
      ...r.rack.map((t) => t.id),
      ...r.inventory.flatMap((x) => (x?.kind === "tool" ? [x.tool.id] : [])),
    ];
    expect(all.filter((id) => id === "beche")).toHaveLength(1);
    expect(r.inventory[2]).toBeNull();
  });
  describe("économie", () => {
    const base = () => createStarterSave();
    const demand = { species: "rosetremiere", color: "red" };

    it("démarre sans PO, sans étal garni, sans client", () => {
      const s = base();
      expect(s).toMatchObject({
        po: 0,
        stall: [],
        stallLevel: 0,
        chestLevel: 0,
        client: null,
        nextClientAt: 0,
      });
    });

    it("complète une sauvegarde d'avant l'économie", () => {
      const { po, stall, stallLevel, chestLevel, client, nextClientAt, ...old } = base();
      expect(parseSave(old)).toMatchObject({
        po: 0,
        stall: [],
        stallLevel: 0,
        chestLevel: 0,
        client: null,
        nextClientAt: 0,
      });
    });

    it("relit les PO en entier positif", () => {
      expect(parseSave({ ...base(), po: -3 })?.po).toBe(0);
      expect(parseSave({ ...base(), po: "12" })?.po).toBe(0);
      expect(parseSave({ ...base(), po: 12.7 })?.po).toBe(12);
    });

    it("borne les niveaux", () => {
      expect(parseSave({ ...base(), stallLevel: 5 })?.stallLevel).toBe(2);
      expect(parseSave({ ...base(), chestLevel: -1 })?.chestLevel).toBe(0);
    });

    it("ne garde dans l'étal que des piles de fleurs lisibles", () => {
      const flowers = { kind: "flowers", ...demand, quality: "belle", count: 2 };
      expect(parseSave({ ...base(), stall: [flowers] })?.stall).toEqual([flowers]);
      expect(parseSave({ ...base(), stall: [flowers, { kind: "x" }] })?.stall).toEqual([]);
      const seeds = {
        kind: "seeds",
        rarity: "commune",
        seeds: [{ rarity: "commune", species: "tournesol", color: "yellow" }],
      };
      expect(parseSave({ ...base(), stall: [seeds] })?.stall).toEqual([]);
    });

    it("relit le client ou l'oublie", () => {
      const client = { demand, look: 2 };
      expect(parseSave({ ...base(), client })?.client).toEqual(client);
      expect(
        parseSave({ ...base(), client: { demand: { species: "x", color: "red" }, look: 2 } })
          ?.client,
      ).toBeNull();
      expect(parseSave({ ...base(), client: { demand, look: 4 } })?.client).toBeNull();
      expect(parseSave({ ...base(), client: { demand, look: -1 } })?.client).toBeNull();
    });

    it("relit le niveau d'un outil", () => {
      const rack = (tool: unknown) => parseSave({ ...base(), rack: [tool] })?.rack[0];
      expect(rack({ id: "beche", level: 2 })).toEqual({ id: "beche", level: 2 });
      expect(rack({ id: "beche", level: 3 })).toEqual({ id: "beche" });
      expect(rack({ id: "beche", level: "2" })).toEqual({ id: "beche" });
    });
  });
});

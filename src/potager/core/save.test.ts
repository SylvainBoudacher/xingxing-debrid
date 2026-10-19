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
});

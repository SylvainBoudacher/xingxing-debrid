import { describe, expect, it } from "vitest";
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
});

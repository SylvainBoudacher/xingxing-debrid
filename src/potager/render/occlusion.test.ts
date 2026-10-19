import { describe, expect, it } from "vitest";
import { hidesAvatar } from "./occlusion";

const tree = { x: 0, z: -8, y: 2.2, palette: 0, size: 4.4 };

describe("arbre devant l'avatar", () => {
  it("cache l'avatar juste derrière le tronc", () => {
    expect(hidesAvatar(tree, { x: 0, z: -9 }, 2.2)).toBe(true);
  });

  it("ne cache pas l'avatar devant l'arbre", () => {
    expect(hidesAvatar(tree, { x: 0, z: -7 }, 2.2)).toBe(false);
  });

  it("ne cache pas l'avatar sur le côté", () => {
    expect(hidesAvatar(tree, { x: 3, z: -9 }, 2.2)).toBe(false);
  });

  it("ne cache pas l'avatar loin derrière, au-dessus de la cime", () => {
    expect(hidesAvatar(tree, { x: 0, z: -16 }, 2.2)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createAvatarMotion } from "./avatarMotion";
import type { Walkable } from "./walk";

const open: Walkable = () => true;
const wall: Walkable = (x) => x < 1;
const origin = { x: 0, z: 0 };

describe("mouvement de l'avatar", () => {
  it("marche à vitesse constante au clavier", () => {
    const m = createAvatarMotion(origin, open);
    m.setInput(1, 0);
    const p = m.update(1);
    expect(p.x).toBeCloseTo(4.5);
    expect(p.facing).toBe(1);
    expect(p.moving).toBe(true);
  });

  it("ne va pas plus vite en diagonale", () => {
    const m = createAvatarMotion(origin, open);
    m.setInput(1, 1);
    const p = m.update(1);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(4.5);
  });

  it("s'arrête sans entrée", () => {
    const m = createAvatarMotion(origin, open);
    m.setInput(0, 1);
    m.setInput(0, 0);
    const p = m.update(1);
    expect(p).toMatchObject({ x: 0, z: 0, moving: false });
  });

  it("garde son orientation en marchant verticalement", () => {
    const m = createAvatarMotion(origin, open);
    m.setInput(-1, 0);
    expect(m.update(0.1).facing).toBe(-1);
    m.setInput(0, 1);
    expect(m.update(0.1).facing).toBe(-1);
  });

  it("glisse le long d'un mur", () => {
    const m = createAvatarMotion(origin, wall);
    m.setInput(1, 1);
    const p = m.update(1);
    expect(p.x).toBe(0);
    expect(p.z).toBeCloseTo(3.18, 2);
  });

  it("suit un chemin jusqu'au bout", () => {
    const m = createAvatarMotion(origin, open);
    m.walkTo([
      { x: 1, z: 0 },
      { x: 1, z: 2 },
    ]);
    expect(m.update(10)).toMatchObject({ x: 1, z: 2 });
    expect(m.update(0.1).moving).toBe(false);
  });

  it("abandonne le chemin quand le clavier prend la main", () => {
    const m = createAvatarMotion(origin, open);
    m.walkTo([{ x: 10, z: 0 }]);
    m.update(0.5);
    m.setInput(0, 1);
    const p = m.update(0.5);
    expect(p.x).toBeCloseTo(2.25);
    expect(p.z).toBeCloseTo(2.25);
  });

  it("ne démarre jamais dans un mur", () => {
    expect(createAvatarMotion({ x: 5, z: 0 }, wall).pose().x).toBeLessThan(1);
  });

  it("reste sur une valeur finie avec un pas nul", () => {
    const m = createAvatarMotion(origin, open);
    m.setInput(1, 0);
    const p = m.update(0);
    expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
  });

  it("se dégage quand le sol sous lui devient bloqué", () => {
    let blocked = false;
    const m = createAvatarMotion(origin, (x) => !blocked || x < -0.5);
    blocked = true;
    m.unstick();
    expect(m.pose().x).toBeLessThan(-0.5);
  });

  it("ne bouge pas s'il n'est pas coincé", () => {
    const m = createAvatarMotion({ x: 0.3, z: 0 }, open);
    m.unstick();
    expect(m.pose()).toMatchObject({ x: 0.3, z: 0 });
  });
});

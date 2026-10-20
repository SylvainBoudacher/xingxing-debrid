import { describe, expect, it } from "vitest";
import {
  AERIAL_DISTANCE,
  createCameraRig,
  DISTANCE,
  FOV,
  FOV_NARROW,
  fovFor,
  TILT_DEG,
} from "./cameraRig";

const bounds = { x0: -24, x1: 24, z0: -14, z1: 8 };
const flat = () => 0;

describe("caméra", () => {
  it("borne le défilement libre", () => {
    const rig = createCameraRig({ x: 0, z: 0, mode: "free" }, bounds, flat);
    rig.pan(1000, 0);
    expect(rig.target().x).toBe(24 - 6);
    rig.pan(0, -1000);
    expect(rig.target().z).toBe(-14 + 4);
  });

  it("ignore le défilement en mode suivi", () => {
    const rig = createCameraRig({ x: 0, z: 0, mode: "follow" }, bounds, flat);
    rig.pan(5, 5);
    expect(rig.target()).toEqual({ x: 0, z: 0 });
  });

  it("rejoint le point suivi", () => {
    const rig = createCameraRig({ x: 0, z: 0, mode: "follow" }, bounds, flat);
    rig.follow({ x: 10, z: 0 });
    rig.update(5);
    expect(Math.abs(rig.target().x - 10)).toBeLessThan(0.01);
  });

  it("place l'œil selon l'inclinaison et la distance", () => {
    const { position, look } = createCameraRig({ x: 0, z: 0, mode: "free" }, bounds, flat).pose();
    expect(position[1] - look[1]).toBeCloseTo(DISTANCE * Math.sin((TILT_DEG * Math.PI) / 180), 6);
  });

  it("se recale sur une vue mémorisée, bornée", () => {
    const rig = createCameraRig({ x: 0, z: 0, mode: "follow" }, bounds, flat);
    rig.reset({ x: 5, z: -2, mode: "free" });
    expect(rig.target()).toEqual({ x: 5, z: -2 });
    expect(rig.mode()).toBe("free");
    rig.reset({ x: 1000, z: 0, mode: "free" });
    expect(rig.target().x).toBe(24 - 6);
  });

  it("élargit le champ dans une fenêtre étroite", () => {
    expect(fovFor(16 / 9)).toBe(FOV);
    expect(fovFor(1.2)).toBe(FOV_NARROW);
  });

  it("prend de la hauteur puis replonge vers le point suivi", () => {
    const rig = createCameraRig({ x: 0, z: 0, mode: "follow" }, bounds, flat);
    rig.liftTo(1, 0);
    expect(rig.pose().distance).toBe(AERIAL_DISTANCE);
    rig.follow({ x: 10, z: 0 });
    rig.liftTo(0, 1);
    rig.update(0.5);
    expect(rig.target().x).toBeCloseTo(5, 6);
    rig.update(0.5);
    expect(rig.target().x).toBe(10);
    expect(rig.pose().distance).toBe(DISTANCE);
  });
});

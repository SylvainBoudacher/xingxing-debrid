import { describe, expect, it } from "vitest";
import { createCameraRig, DISTANCE, TILT_DEG } from "./cameraRig";

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
});

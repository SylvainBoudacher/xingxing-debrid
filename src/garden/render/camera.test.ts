import { describe, expect, it } from "vitest";
import { fieldRect } from "../core/plots";
import type { PlotId } from "../core/types";
import { createCameraRig, MOTION_TAIL, ZOOM } from "./camera";
import { framing, VIEWS } from "./framing";

const ALL: PlotId[] = ["p1", "p2", "p3", "p4"];
const start = () => {
  const plots: PlotId[] = ["p1"];
  return createCameraRig(framing(VIEWS.garden, fieldRect(plots)), fieldRect(plots));
};
const dist = (rig: ReturnType<typeof createCameraRig>) => {
  const p = rig.pose();
  return Math.hypot(p.y - p.look[1], p.z - p.look[2]);
};

describe("rig de caméra", () => {
  it("reprend le cadrage automatique tant qu'on n'y touche pas", () => {
    const view = framing(VIEWS.garden, fieldRect(["p1"]));
    const p = start().pose();
    expect(p.x).toBeCloseTo(view.look[0], 5);
    expect(p.y).toBeCloseTo(view.y, 5);
    expect(p.z).toBeCloseTo(view.z, 5);
    expect(p.look).toEqual(view.look);
    expect(start().moved).toBe(false);
  });

  it("déplace la visée et la caméra du même vecteur", () => {
    const rig = start();
    const before = rig.pose();
    rig.pan(1.5, -2);
    const after = rig.pose();
    expect(after.look[0] - before.look[0]).toBeCloseTo(1.5, 5);
    expect(after.look[2] - before.look[2]).toBeCloseTo(-2, 5);
    expect(after.x - before.x).toBeCloseTo(1.5, 5);
    expect(after.z - before.z).toBeCloseTo(-2, 5);
    expect(rig.moved).toBe(true);
  });

  it("garde la visée au-dessus du champ", () => {
    const rig = start();
    rig.pan(500, 500);
    const far = rig.pose();
    rig.pan(500, 500);
    expect(rig.pose().look).toEqual(far.look);
  });

  it("borne le zoom", () => {
    const rig = start();
    for (let i = 0; i < 40; i++) rig.zoomBy(1);
    expect(rig.zoom).toBeCloseTo(ZOOM.max, 5);
    for (let i = 0; i < 80; i++) rig.zoomBy(-1);
    expect(rig.zoom).toBeCloseTo(ZOOM.min, 5);
  });

  it("rapproche la caméra sans changer la visée ni l'angle", () => {
    const rig = start();
    const before = rig.pose();
    const d = dist(rig);
    rig.zoomBy(-0.5);
    const after = rig.pose();
    expect(after.look).toEqual(before.look);
    expect(dist(rig)).toBeLessThan(d);
    const ratio = (after.y - after.look[1]) / (before.y - before.look[1]);
    expect((after.z - after.look[2]) / (before.z - before.look[2])).toBeCloseTo(ratio, 5);
  });

  it("avance au clavier d'autant plus vite que la caméra est loin", () => {
    const near = start();
    const far = start();
    near.zoomBy(-10);
    far.zoomBy(10);
    const travel = (rig: ReturnType<typeof createCameraRig>) => {
      const before = rig.pose().look[2];
      rig.nudge(0.1, { x: 0, z: -1 });
      return before - rig.pose().look[2];
    };
    expect(travel(near)).toBeGreaterThan(0);
    expect(travel(far)).toBeGreaterThan(travel(near));
  });

  it("se dit en mouvement juste après une commande, puis se tait", () => {
    const rig = start();
    expect(rig.moving(0)).toBe(false);
    rig.pan(1, 0);
    expect(rig.moving(performance.now())).toBe(true);
    expect(rig.moving(performance.now() + MOTION_TAIL + 1)).toBe(false);
    rig.zoomBy(0.1);
    expect(rig.moving(performance.now())).toBe(true);
  });

  it("reste en mouvement tant qu'une touche pousse la caméra", () => {
    const rig = start();
    rig.nudge(0.016, { x: 1, z: 0 });
    expect(rig.moving(performance.now())).toBe(true);
  });

  it("revient au cadrage automatique", () => {
    const rig = start();
    const before = rig.pose();
    rig.pan(2, 2);
    rig.zoomBy(0.4);
    rig.reset();
    expect(rig.pose()).toEqual(before);
    expect(rig.moved).toBe(false);
    expect(rig.zoom).toBe(1);
  });

  it("garde le décalage en cours quand le champ s'agrandit", () => {
    const rig = start();
    rig.pan(1, 1);
    const view = framing(VIEWS.garden, fieldRect(ALL));
    rig.setFrame(view, fieldRect(ALL));
    expect(rig.pose().look[0]).toBeCloseTo(view.look[0] + 1, 5);
    expect(rig.pose().look[2]).toBeCloseTo(view.look[2] + 1, 5);
    expect(rig.moved).toBe(true);
  });

  it("laisse voir au-delà du champ de départ une fois agrandi", () => {
    const small = start();
    small.pan(0, 500);
    const big = start();
    big.setFrame(framing(VIEWS.garden, fieldRect(ALL)), fieldRect(ALL));
    big.pan(0, 500);
    expect(big.pose().look[2]).toBeGreaterThan(small.pose().look[2]);
  });
});

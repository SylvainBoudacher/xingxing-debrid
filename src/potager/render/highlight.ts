import * as THREE from "three";
import type { Target } from "../core/actions";
import { groundHeight, MAP } from "../core/catalog/map";
import { parcelCells } from "../core/cells";

const GOLD = "#f2d27a";
const BAR = 0.07;

// Cadre doré pulsant sur la case visée, anneau autour de l'abri ou du puits.
export function createHighlight(scene: THREE.Scene) {
  const mat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false });
  const frame = new THREE.Group();
  const bars = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, BAR), mat);
    m.rotation.x = -Math.PI / 2;
    if (i >= 2) m.rotation.z = Math.PI / 2;
    frame.add(m);
    return m;
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), mat);
  ring.rotation.x = -Math.PI / 2;
  frame.visible = ring.visible = false;
  scene.add(frame, ring);
  let key = "";

  function set(t: Target | null) {
    const k = t ? (t.kind === "cell" ? t.key : t.kind === "foret" ? `foret${t.spot}` : t.kind) : "";
    if (k === key) return;
    key = k;
    frame.visible = ring.visible = false;
    if (!t) return;
    if (t.kind === "cell") {
      const c = MAP.parcels.flatMap((p) => parcelCells(p.id)).find((x) => x.key === t.key);
      if (!c) return;
      const { x0, x1 } = c.rect;
      const inset = 0.06;
      const w = x1 - x0 - inset * 2;
      bars[0].position.set(0, 0, -w / 2);
      bars[1].position.set(0, 0, w / 2);
      bars[2].position.set(-w / 2, 0, 0);
      bars[3].position.set(w / 2, 0, 0);
      bars.forEach((b) => b.scale.set(w + BAR, 1, 1));
      frame.position.set(c.center.x, groundHeight(c.center.x, c.center.z) + 0.19, c.center.z);
      frame.visible = true;
      return;
    }
    const at = t.kind === "abri" ? MAP.abri : t.kind === "puits" ? MAP.puits : MAP.forest[t.spot];
    const r =
      t.kind === "abri"
        ? Math.max(MAP.abri.w, MAP.abri.d) * 0.62
        : t.kind === "puits"
          ? MAP.puits.r + 0.25
          : 0.4;
    ring.scale.setScalar(r);
    ring.position.set(at.x, groundHeight(at.x, at.z) + 0.03, at.z);
    ring.visible = true;
  }

  return {
    set,
    update(t: number) {
      mat.opacity = 0.55 + Math.sin(t * 5) * 0.3;
    },
    dispose() {
      scene.remove(frame, ring);
      bars.forEach((b) => b.geometry.dispose());
      ring.geometry.dispose();
      mat.dispose();
    },
  };
}

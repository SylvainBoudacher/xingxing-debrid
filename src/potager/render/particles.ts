import * as THREE from "three";
import { glowTex, leafTex } from "../textures/nature";

const MOTES = 90;
const LEAVES = 26;

// Poussières lumineuses et feuilles qui tombent, autour du point regardé.
export function createParticles(scene: THREE.Scene) {
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const pos = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) pos.set([rnd(-14, 14), rnd(0.2, 5), rnd(-8, 5)], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const motes = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      map: glowTex(),
      size: 0.22,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: "#ffe2a8",
    }),
  );
  scene.add(motes);

  const leafTexs = [0, 1, 2].map(leafTex);
  const leaves = Array.from({ length: LEAVES }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: leafTexs[i % 3] }));
    s.scale.set(0.22, 0.17, 1);
    scene.add(s);
    return { s, sp: 0, ph: 0 };
  });
  const reset = (l: (typeof leaves)[number], cx: number, cz: number, first: boolean) => {
    l.s.position.set(cx + rnd(-14, 14), first ? rnd(0, 8) : rnd(7, 9), cz + rnd(-9, 4));
    l.sp = rnd(0.4, 0.8);
    l.ph = rnd(0, 6);
  };
  leaves.forEach((l) => reset(l, 0, 0, true));

  return {
    update(dt: number, t: number, center: { x: number; z: number }) {
      motes.position.set(center.x, 0, center.z);
      for (let i = 0; i < MOTES; i++) {
        pos[i * 3 + 1] += dt * 0.12;
        pos[i * 3] += Math.sin(t * 0.5 + i) * dt * 0.1;
        if (pos[i * 3 + 1] > 5.5) pos[i * 3 + 1] = 0.2;
      }
      geo.attributes.position.needsUpdate = true;
      for (const l of leaves) {
        l.s.position.y -= l.sp * dt;
        l.s.position.x += Math.sin(t * 1.3 + l.ph) * dt * 0.7 + dt * 0.3;
        l.s.material.rotation = Math.sin(t * 2 + l.ph) * 1.5;
        if (l.s.position.y < 0.05) reset(l, center.x, center.z, false);
      }
    },
  };
}

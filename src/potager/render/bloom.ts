import * as THREE from "three";

const DURATION = 1.1;
const SPARKS = 14;

interface Burst {
  key: string;
  t: number;
  flower: THREE.Mesh;
  sparks: THREE.Mesh[];
  vel: THREE.Vector3[];
}

// Éclosion : la fleur grandit d'un coup et projette des éclats dorés.
export function createBloom(scene: THREE.Scene) {
  const geo = new THREE.PlaneGeometry(0.09, 0.09);
  const bursts: Burst[] = [];

  function play(key: string, flower: THREE.Mesh) {
    const sparks: THREE.Mesh[] = [],
      vel: THREE.Vector3[] = [];
    for (let i = 0; i < SPARKS; i++) {
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: i % 3 ? "#f8d870" : "#fff4c8",
          transparent: true,
          depthWrite: false,
        }),
      );
      m.position.copy(flower.position).add(new THREE.Vector3(0, 0.9, 0));
      scene.add(m);
      sparks.push(m);
      const a = (i / SPARKS) * Math.PI * 2;
      vel.push(new THREE.Vector3(Math.cos(a) * 1.4, 1.2 + (i % 4) * 0.4, Math.sin(a) * 0.5));
    }
    flower.scale.setScalar(0.2);
    bursts.push({ key, t: 0, flower, sparks, vel });
  }

  // jardin reconstruit pendant une animation : elle continue sur la nouvelle fleur
  function rebind(flowers: Map<string, THREE.Mesh>) {
    for (const b of bursts) {
      const next = flowers.get(b.key);
      if (!next || next === b.flower) continue;
      next.scale.copy(b.flower.scale);
      b.flower = next;
    }
  }

  function update(dt: number) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt;
      const k = Math.min(1, b.t / DURATION);
      // petit dépassement avant de se poser
      b.flower.scale.setScalar(k < 0.4 ? 0.2 + (k / 0.4) * 1 : 1.2 - ((k - 0.4) / 0.6) * 0.2);
      b.sparks.forEach((s, j) => {
        b.vel[j].y -= 3 * dt;
        s.position.addScaledVector(b.vel[j], dt);
        (s.material as THREE.MeshBasicMaterial).opacity = 1 - k;
      });
      if (k < 1) continue;
      b.flower.scale.setScalar(1);
      b.sparks.forEach((s) => {
        scene.remove(s);
        (s.material as THREE.Material).dispose();
      });
      bursts.splice(i, 1);
    }
  }

  return { play, rebind, update, dispose: () => geo.dispose() };
}

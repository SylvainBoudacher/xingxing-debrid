import * as THREE from "three";
import type { Particle } from "../core/actions";
import { parseTileKey, type TileKey } from "../core/types";
import { wx, wz } from "./world";

type Rgb = [number, number, number];

interface Kind {
  n: number;
  cols: Rgb[];
  y: [number, number];
  v: Rgb;
  g: number;
  life: number;
}

// Couleurs au-delà de 1 : captées par le bloom.
const KINDS: Record<Particle, Kind> = {
  water: {
    n: 34,
    cols: [
      [0.55, 0.8, 1.7],
      [0.8, 0.95, 1.8],
    ],
    y: [0.9, 1.4],
    v: [0.3, -2.2, 0.3],
    g: -3,
    life: 0.7,
  },
  dirt: {
    n: 16,
    cols: [
      [0.35, 0.22, 0.14],
      [0.5, 0.34, 0.22],
    ],
    y: [0.02, 0.1],
    v: [1.1, 1.6, 1.1],
    g: -6,
    life: 0.5,
  },
  leaves: {
    n: 30,
    cols: [
      [1.1, 0.4, 0.12],
      [1.2, 0.7, 0.2],
      [1.2, 0.9, 0.3],
    ],
    y: [0.05, 0.3],
    v: [1.6, 2.2, 1.2],
    g: -3.5,
    life: 1.1,
  },
  petals: {
    n: 26,
    cols: [
      [1.6, 0.9, 1.2],
      [1.8, 1.5, 1.6],
      [1.4, 0.6, 0.8],
    ],
    y: [0.8, 1.2],
    v: [1.2, 1.4, 1.0],
    g: -2,
    life: 1.0,
  },
  feathers: {
    n: 14,
    cols: [
      [0.12, 0.1, 0.18],
      [0.25, 0.22, 0.32],
    ],
    y: [0.4, 0.7],
    v: [1.2, 1.2, 1.0],
    g: -1.2,
    life: 1.0,
  },
};

const MAX = 600;

interface Part {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  g: number;
  life: number;
  age: number;
  c: Rgb;
}

export interface Particles {
  burst(key: TileKey, particle: Particle): void;
  update(t: number): void;
  dispose(): void;
}

export function createParticles(scene: THREE.Scene): Particles {
  const pos = new Float32Array(MAX * 3);
  const col = new Float32Array(MAX * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const material = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);
  const parts: Part[] = [];
  let prev = 0;

  return {
    burst(key, particle) {
      const [tx, ty] = parseTileKey(key);
      const k = KINDS[particle];
      for (let i = 0; i < k.n; i++) {
        if (parts.length >= MAX) parts.shift();
        parts.push({
          x: wx(tx) + (Math.random() - 0.5) * 0.6,
          y: k.y[0] + Math.random() * (k.y[1] - k.y[0]),
          z: wz(ty) + 0.35 + (Math.random() - 0.5) * 0.3,
          vx: (Math.random() - 0.5) * k.v[0],
          vy: particle === "water" ? k.v[1] * (0.6 + Math.random() * 0.4) : Math.random() * k.v[1],
          vz: (Math.random() - 0.5) * k.v[2],
          g: k.g,
          life: k.life * (0.6 + Math.random() * 0.6),
          age: 0,
          c: k.cols[i % k.cols.length],
        });
      }
    },
    update(t) {
      const dt = Math.min(0.05, Math.max(0, t - prev));
      prev = t;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age > p.life) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.01, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
      parts.forEach((p, i) => {
        const f = 1 - p.age / p.life;
        pos.set([p.x, p.y, p.z], i * 3);
        col.set([p.c[0] * f, p.c[1] * f, p.c[2] * f], i * 3);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.setDrawRange(0, parts.length);
    },
    dispose() {
      scene.remove(points);
      geo.dispose();
      material.dispose();
    },
  };
}

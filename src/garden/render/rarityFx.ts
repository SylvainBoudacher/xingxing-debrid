import * as THREE from "three";
import type { Rarity, VariantId } from "../core/types";
import { LANTERN_BELLS } from "../sprites/species/lanternelune";
import { crossTexture, makeCanvas, radialTexture, raysTexture, silhouetteGlow } from "./fxTextures";
import type { SceneItem } from "./sceneModel";
import { pixelTexture } from "./texture";

export const PLANT_PARTICLES = 12;
export const SCENE_PARTICLES = 150;

export interface FxBudget {
  take(n: number): number;
  give(n: number): void;
}

export function createFxBudget(max: number): FxBudget {
  let left = max;
  return {
    take(n) {
      const got = Math.min(n, left);
      left -= got;
      return got;
    },
    give(n) {
      left = Math.min(max, left + n);
    },
  };
}

export interface PlantFx {
  update(t: number, dt: number, night: boolean): void;
  dispose(): void;
}

interface Part {
  update?(t: number, dt: number, night: boolean): void;
  dispose(): void;
}

type Rgb = [number, number, number];
type Motion = "twinkle" | "rise" | "drift" | "snow";

interface SparkSpec {
  motion: Motion;
  n: number;
  rate: number;
  rgb: Rgb;
  size: number;
}

// Couleurs au-delà de 1 : captées par le bloom.
const RARITY_SPARKS: Partial<Record<Rarity, SparkSpec>> = {
  rare: { motion: "twinkle", n: 6, rate: 5, rgb: [2.2, 2.4, 2.8], size: 0.26 },
  epique: { motion: "rise", n: 8, rate: 4, rgb: [1.8, 1.3, 2.6], size: 0.14 },
  legendaire: { motion: "drift", n: 10, rate: 5, rgb: [2.6, 2.2, 1.2], size: 0.2 },
};

const VARIANT_SPARKS: Partial<Record<VariantId, SparkSpec>> = {
  givree: { motion: "snow", n: 6, rate: 2.5, rgb: [2, 2.2, 2.5], size: 0.14 },
  doree: { motion: "twinkle", n: 4, rate: 3, rgb: [2.6, 2.1, 0.9], size: 0.24 },
};

const LIFE: Record<Motion, number> = { twinkle: 0.6, rise: 2, drift: 2.5, snow: 4 };

function additive(map: THREE.Texture) {
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function sparks(parent: THREE.Object3D, spec: SparkSpec, n: number): Part {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const age = new Float32Array(n).fill(Infinity);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    map: crossTexture(),
    size: spec.size,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  parent.add(points);
  const life = LIFE[spec.motion];
  let debt = 0;

  function spawn(i: number) {
    const j = i * 3;
    age[i] = 0;
    pos[j + 2] = 0.03;
    if (spec.motion === "snow") {
      pos[j] = (Math.random() - 0.5) * 0.9;
      pos[j + 1] = 1.55;
    } else if (spec.motion === "rise") {
      pos[j] = (Math.random() - 0.5) * 0.7;
      pos[j + 1] = 0.3 + Math.random() * 0.6;
    } else {
      pos[j] = (Math.random() - 0.5) * 0.7;
      pos[j + 1] = 0.75 + Math.random() * 0.65;
    }
  }

  return {
    update(t, dt) {
      debt = Math.min(debt + dt * spec.rate, 2);
      for (let i = 0; i < n && debt >= 1; i++)
        if (age[i] >= life) {
          spawn(i);
          debt--;
        }
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        age[i] += dt;
        const a = age[i];
        if (a >= life) {
          col[j] = col[j + 1] = col[j + 2] = 0;
          continue;
        }
        if (spec.motion === "rise") pos[j + 1] += 0.35 * dt;
        if (spec.motion === "drift") {
          pos[j + 1] += 0.15 * dt;
          pos[j] += Math.sin(t * 2 + i) * 0.1 * dt;
        }
        if (spec.motion === "snow") pos[j + 1] -= 0.3 * dt;
        const k =
          spec.motion === "twinkle" ? Math.sin((a / life) * Math.PI) : Math.min(1, life - a, a * 3);
        col[j] = spec.rgb[0] * k;
        col[j + 1] = spec.rgb[1] * k;
        col[j + 2] = spec.rgb[2] * k;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
    dispose() {
      parent.remove(points);
      geo.dispose();
      mat.dispose();
    },
  };
}

const GLOW_PAD = 3;

// Halo de silhouette, mêmes proportions que le billboard (1 x 1,5, pied à l'origine).
function silhouettePlane(parent: THREE.Mesh, color: string) {
  const source = parent.userData.canvas as HTMLCanvasElement;
  const map = silhouetteGlow(source, color, GLOW_PAD);
  const px = 1 / source.width;
  const geo = new THREE.PlaneGeometry(1 + 2 * GLOW_PAD * px, 1.5 + 2 * GLOW_PAD * px);
  geo.translate(0, 0.75, -0.01);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  return {
    mat,
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

function flatPlane(parent: THREE.Object3D, map: THREE.Texture, size: number, y: number, z: number) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, y, z);
  parent.add(mesh);
  return {
    mesh,
    mat,
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

// Reflet qui balaie la fleur, redessiné 15 fois par seconde.
function goldGlint(parent: THREE.Mesh): Part {
  const source = parent.userData.canvas as HTMLCanvasElement;
  const cv = makeCanvas(source.width, source.height);
  const g = cv.getContext("2d")!;
  const map = pixelTexture(cv);
  const geo = new THREE.PlaneGeometry(1, 1.5);
  geo.translate(0, 0.75, 0.005);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  let last = -1;
  return {
    update(t) {
      if (t - last < 1 / 15) return;
      last = t;
      const ph = (t * 0.5) % 1.6;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, cv.width, cv.height);
      if (ph <= 1) {
        const x = -20 + ph * (cv.width + 40);
        const grad = g.createLinearGradient(x - 10, 0, x + 10, 24);
        grad.addColorStop(0, "rgba(255,255,240,0)");
        grad.addColorStop(0.5, "rgba(255,255,240,0.9)");
        grad.addColorStop(1, "rgba(255,255,240,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, cv.width, cv.height);
        g.globalCompositeOperation = "destination-in";
        g.drawImage(source, 0, 0);
      }
      map.needsUpdate = true;
    },
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

function bells(parent: THREE.Object3D): Part {
  const lights = LANTERN_BELLS.map(([x, y]) => {
    const light = new THREE.PointLight(0xaaccff, 0, 1.6, 2);
    light.position.set(x / 32 - 0.5, (48 - y) / 32, 0.2);
    parent.add(light);
    return light;
  });
  return {
    update(t, _dt, night) {
      lights.forEach(
        (l, i) => (l.intensity = (night ? 0.7 : 0.3) * (0.8 + 0.2 * Math.sin(t * 2 + i))),
      );
    },
    dispose() {
      lights.forEach((l) => parent.remove(l));
    },
  };
}

function legendaryGlow(mesh: THREE.Mesh): Part {
  const halo = flatPlane(mesh, radialTexture("255,210,110"), 1.2, 1.05, -0.03);
  const rays = flatPlane(mesh, raysTexture(), 1.6, 1.05, -0.04);
  // flaque de lumière au pied de la plante
  const light = new THREE.PointLight(0xffd88a, 1, 1.8, 2);
  light.position.set(0, 0.2, 0.3);
  mesh.add(light);
  return {
    update(t, _dt, night) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
      halo.mat.opacity = (night ? 0.26 : 0.22) * (0.7 + 0.3 * pulse);
      rays.mat.opacity = night ? 0.1 : 0.09;
      rays.mesh.rotation.z = t * 0.2;
      light.intensity = (night ? 1.2 : 0.8) * (0.85 + 0.15 * pulse);
    },
    dispose() {
      halo.dispose();
      rays.dispose();
      mesh.remove(light);
    },
  };
}

// Effets d'une plante éclose : enfants du billboard, ils suivent son balancement.
export function createPlantFx(mesh: THREE.Mesh, item: SceneItem, budget: FxBudget): PlantFx | null {
  const { rarity, variant } = item;
  if (!rarity || (rarity === "commune" && !variant)) return null;
  const parts: Part[] = [];
  let taken = 0;
  const addSparks = (spec: SparkSpec | undefined) => {
    if (!spec) return;
    const n = budget.take(Math.min(spec.n, PLANT_PARTICLES - taken));
    if (!n) return;
    taken += n;
    parts.push(sparks(mesh, spec, n));
  };

  addSparks(RARITY_SPARKS[rarity]);
  addSparks(variant ? VARIANT_SPARKS[variant] : undefined);

  if (rarity === "epique") {
    const aura = silhouettePlane(mesh, "#c9a0ff");
    parts.push({
      update: (t) => (aura.mat.opacity = 0.7 + 0.3 * Math.sin(t * 2.4)),
      dispose: aura.dispose,
    });
  }
  if (rarity === "legendaire") parts.push(legendaryGlow(mesh));
  if (variant === "doree") parts.push(goldGlint(mesh));
  if (variant === "lumineuse") {
    const glow = silhouettePlane(mesh, "#9fe0d0");
    parts.push({
      update: (t, _dt, night) =>
        (glow.mat.opacity = (night ? 1 : 0.55) * (0.6 + 0.4 * Math.sin(t * 1.3))),
      dispose: glow.dispose,
    });
  }
  if (item.ref.name === "lanternelune") parts.push(bells(mesh));

  return {
    update(t, dt, night) {
      for (const p of parts) p.update?.(t, dt, night);
    },
    dispose() {
      for (const p of parts) p.dispose();
      budget.give(taken);
    },
  };
}

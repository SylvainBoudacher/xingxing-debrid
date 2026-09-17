import * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { holeTile } from "../sprites/ground";
import { spriteCanvas } from "../sprites/sprite";
import { createFxBudget, createPlantFx, SCENE_PARTICLES, type PlantFx } from "./rarityFx";
import type { SceneItem } from "./sceneModel";
import { pixelTexture } from "./texture";
import { wx, wz } from "./world";

export interface Lanterns {
  glows: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  lights: THREE.PointLight[];
}

export interface Billboards {
  add(key: TileKey, item: SceneItem): void;
  remove(key: TileKey): void;
  addStatic(
    canvas: HTMLCanvasElement,
    x: number,
    z: number,
    w: number,
    h: number,
    sway: boolean,
    phase: number,
  ): void;
  sway(t: number, raining: boolean): void;
  updateFx(t: number, dt: number, night: boolean): void;
  lanterns(): Lanterns;
  get(key: TileKey): THREE.Mesh | undefined;
  entries(): [TileKey, THREE.Mesh][];
  dispose(): void;
}

export const THIRSTY_LEAN = 0.14;

// Un sprite debout sur le sol, pivot au pied, ombre découpée selon sa silhouette.
export function makeBillboard(canvas: HTMLCanvasElement, w: number, h: number): THREE.Mesh {
  const map = pixelTexture(canvas);
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshStandardMaterial({
    map,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map,
    alphaTest: 0.5,
  });
  mesh.userData.canvas = canvas;
  return mesh;
}

const HOLE_DECAL = 0.75;

// Décalque posé à plat au centre de la case (le trou), il reçoit les ombres sans en projeter.
function makeDecal(canvas: HTMLCanvasElement, size: number): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    map: pixelTexture(canvas),
    alphaTest: 0.5,
    roughness: 1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.userData.canvas = canvas;
  return mesh;
}

export function disposeMesh(mesh: THREE.Mesh) {
  const mat = mesh.material as THREE.MeshStandardMaterial;
  mat.map?.dispose();
  mat.dispose();
  mesh.customDepthMaterial?.dispose();
  mesh.geometry.dispose();
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child !== mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
}

export function createBillboards(scene: THREE.Scene): Billboards {
  const placed = new Map<TileKey, THREE.Mesh>();
  const swayers: { mesh: THREE.Mesh; phase: number; lean: number }[] = [];
  const statics: THREE.Mesh[] = [];
  const lanterns: Lanterns = { glows: [], lights: [] };
  const budget = createFxBudget(SCENE_PARTICLES);
  const fx = new Map<TileKey, PlantFx>();

  function addLantern(mesh: THREE.Mesh) {
    const gx = 21 / 32 - 0.5;
    const gy = (48 - 30.5) / 32;
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2 / 32, 5.5 / 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.1), toneMapped: false }),
    );
    glow.position.set(gx, gy, 0.01);
    const light = new THREE.PointLight(0xffa850, 0, 4.5, 1.6);
    light.position.set(gx, gy, 0.25);
    mesh.add(glow, light);
    lanterns.glows.push(glow);
    lanterns.lights.push(light);
  }

  function forget(mesh: THREE.Mesh) {
    const i = swayers.findIndex((s) => s.mesh === mesh);
    if (i >= 0) swayers.splice(i, 1);
    for (const child of mesh.children) {
      lanterns.glows = lanterns.glows.filter((g) => g !== child);
      lanterns.lights = lanterns.lights.filter((l) => l !== child);
    }
  }

  return {
    add(key, item) {
      const [tx, ty] = parseTileKey(key);
      if (item.ref.name === "trou") {
        const decal = makeDecal(holeTile(), HOLE_DECAL);
        decal.position.set(wx(tx), 0.008, wz(ty));
        scene.add(decal);
        placed.set(key, decal);
        return;
      }
      const mesh = makeBillboard(spriteCanvas(item.ref), 1, 1.5);
      mesh.position.set(wx(tx), 0, wz(ty));
      const lean = item.thirsty ? THIRSTY_LEAN : 0;
      mesh.rotation.z = lean;
      if (item.ref.name === "lanterne") addLantern(mesh);
      const plantFx = createPlantFx(mesh, item, budget);
      if (plantFx) fx.set(key, plantFx);
      if (item.sway) swayers.push({ mesh, phase: tx * 1.7 + ty, lean });
      scene.add(mesh);
      placed.set(key, mesh);
    },
    remove(key) {
      const mesh = placed.get(key);
      if (!mesh) return;
      fx.get(key)?.dispose();
      fx.delete(key);
      forget(mesh);
      scene.remove(mesh);
      disposeMesh(mesh);
      placed.delete(key);
    },
    addStatic(canvas, x, z, w, h, sway, phase) {
      const mesh = makeBillboard(canvas, w, h);
      mesh.position.set(x, 0, z);
      if (sway) swayers.push({ mesh, phase, lean: 0 });
      scene.add(mesh);
      statics.push(mesh);
    },
    sway(t, raining) {
      for (const s of swayers) {
        const limp = s.lean !== 0;
        s.mesh.rotation.z =
          s.lean +
          Math.sin(t * (limp ? 0.5 : 0.9) + s.phase) * (limp ? 0.015 : 0.035) +
          (raining ? Math.sin(t * 3 + s.phase) * 0.02 : 0);
      }
    },
    updateFx(t, dt, night) {
      for (const f of fx.values()) f.update(t, dt, night);
    },
    lanterns: () => lanterns,
    get: (key) => placed.get(key),
    entries: () => [...placed.entries()],
    dispose() {
      for (const f of fx.values()) f.dispose();
      fx.clear();
      for (const mesh of [...placed.values(), ...statics]) {
        scene.remove(mesh);
        disposeMesh(mesh);
      }
      placed.clear();
      statics.length = 0;
      swayers.length = 0;
    },
  };
}

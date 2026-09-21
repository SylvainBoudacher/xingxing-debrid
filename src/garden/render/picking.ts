import * as THREE from "three";
import type { Target } from "../core/actions";
import { isInField } from "../core/plots";
import { tileKey, type PlotId, type TileKey } from "../core/types";
import { WORLD } from "./world";

export interface PickResult {
  target: Target;
  ground: { key: TileKey; x: number; z: number } | null;
}

export interface Pickable {
  mesh: THREE.Mesh;
  target: Target;
}

const alphaCache = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();

// Vrai si le pixel du sprite sous le rayon est opaque : on vise à travers les vides.
function opaqueAt(canvas: HTMLCanvasElement, uv: THREE.Vector2): boolean {
  let data = alphaCache.get(canvas);
  if (!data) {
    data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    alphaCache.set(canvas, data);
  }
  const px = Math.min(canvas.width - 1, Math.floor(uv.x * canvas.width));
  const py = Math.min(canvas.height - 1, Math.floor((1 - uv.y) * canvas.height));
  return data[(py * canvas.width + px) * 4 + 3] > 0;
}

export function createPicker(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  plotsOf: () => PlotId[],
) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  return function pickAt(
    clientX: number,
    clientY: number,
    pickables: Pickable[],
  ): PickResult | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);

    const onFloor = ray.ray.intersectPlane(floor, hit);
    const ground = onFloor
      ? { key: tileKey(Math.floor(hit.x - WORLD.X0), Math.floor(hit.z + 2)), x: hit.x, z: hit.z }
      : null;

    const meshes = pickables.map((p) => p.mesh);
    for (const h of ray.intersectObjects(meshes, false)) {
      const canvasOf = h.object.userData.canvas as HTMLCanvasElement | undefined;
      if (!h.uv || !canvasOf || !opaqueAt(canvasOf, h.uv)) continue;
      return { target: pickables[meshes.indexOf(h.object as THREE.Mesh)].target, ground };
    }
    if (!ground || !isInField(plotsOf(), ground.key)) return null;
    return { target: { kind: "tile", key: ground.key }, ground };
  };
}

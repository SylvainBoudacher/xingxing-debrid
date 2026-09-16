import type * as THREE from "three";
import type { Particle, Target } from "../core/actions";
import { parseTileKey, type TileKey } from "../core/types";
import type { Billboards } from "./billboards";
import { createCrows } from "./crows";
import { createHighlight, TONES, type HighlightTone } from "./highlight";
import { createParticles } from "./particles";
import { createPicker, type Pickable, type PickResult } from "./picking";
import { wx, wz } from "./world";

export interface GardenInteraction {
  pickAt(clientX: number, clientY: number, ignore?: TileKey): PickResult | null;
  setHighlight(target: Target | null, tone?: HighlightTone): void;
  burst(key: TileKey, particle: Particle): void;
  lift(key: TileKey): void;
  moveLifted(x: number, z: number): void;
  drop(): void;
  addCrow(id: string, key: TileKey): void;
  chaseCrow(id: string): void;
  removeCrow(id: string): void;
  update(t: number): void;
  dispose(): void;
}

export function createInteraction(
  scene: THREE.Scene,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  billboards: Billboards,
): GardenInteraction {
  const pick = createPicker(camera, canvas);
  const highlight = createHighlight(scene);
  const particles = createParticles(scene);
  const crows = createCrows(scene);
  let lifted: TileKey | null = null;
  let clock = 0;

  // la clé est relue à chaque image : sync peut avoir recréé le mesh entre-temps
  const liftedMesh = () => (lifted ? billboards.get(lifted) : undefined);

  function resetLifted() {
    const mesh = liftedMesh();
    if (mesh && lifted) {
      const [tx, ty] = parseTileKey(lifted);
      mesh.position.set(wx(tx), 0, wz(ty) + 0.35);
      mesh.renderOrder = 0;
    }
    lifted = null;
  }

  return {
    pickAt(clientX, clientY, ignore) {
      const pickables: Pickable[] = [
        ...crows.perched().map(({ id, mesh }) => ({ mesh, target: { kind: "crow" as const, id } })),
        ...billboards
          .entries()
          .filter(([key]) => key !== ignore)
          .map(([key, mesh]) => ({ mesh, target: { kind: "tile" as const, key } })),
      ];
      return pick(clientX, clientY, pickables);
    },
    // une seule cible surlignée : cadre au sol pour une case, contour pour un corbeau
    setHighlight(target, tone = "info") {
      highlight.set(target?.kind === "tile" ? target.key : null, tone);
      crows.outline(target?.kind === "crow" ? target.id : null, TONES[tone]);
    },
    burst: particles.burst,
    lift(key) {
      resetLifted();
      lifted = key;
      const mesh = liftedMesh();
      if (mesh) mesh.renderOrder = 2;
    },
    moveLifted(x, z) {
      const mesh = liftedMesh();
      if (mesh) mesh.position.set(x, mesh.position.y, z + 0.35);
    },
    drop: resetLifted,
    addCrow(id, key) {
      crows.add(id, key, clock);
    },
    chaseCrow(id) {
      const key = crows.fly(id, clock);
      if (key) particles.burst(key, "feathers");
    },
    removeCrow(id) {
      crows.fly(id, clock);
    },
    update(t) {
      clock = t;
      highlight.update(t);
      particles.update(t);
      crows.update(t);
      const mesh = liftedMesh();
      if (mesh) mesh.position.y = 0.2 + Math.sin(t * 6) * 0.04;
    },
    dispose() {
      highlight.dispose();
      particles.dispose();
      crows.dispose();
    },
  };
}

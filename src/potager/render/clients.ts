import * as THREE from "three";
import { groundHeight } from "../core/catalog/map";
import type { Client, Point } from "../core/types";
import { avatarViews, CLIENT_PALETTES } from "../textures/avatar";
import { spriteMesh } from "./sprite";

const SPEED = 3.2;
const STEP_FRAME_S = 0.075;
const ROAD_Z = 2.8;
const ENTRY: Point = { x: -29, z: ROAD_Z };
// devant l'étal, à gauche de l'endroit où se tient l'avatar
const STALL_SPOT: Point = { x: -6.6, z: 0.9 };

const route = (to: Point): Point[] => [
  { x: to.x, z: ROAD_Z },
  { x: to.x, z: to.z },
];

// Un client à la fois : arrive par l'ouest, attend devant l'étal, repart quand la demande est servie.
export function createClients(scene: THREE.Scene) {
  const sets = CLIENT_PALETTES.map((p) => avatarViews(p));
  const mesh = spriteMesh(sets[0].views.down.idle, 1.2, 1.8);
  mesh.visible = false;
  scene.add(mesh);
  const mat = mesh.material as THREE.MeshLambertMaterial;
  let look = 0;
  let pos: Point = ENTRY;
  let path: Point[] = [];
  let leaving = false;
  let present = false;
  let walkT = 0;
  let dir: Point = { x: 1, z: 0 };

  function place() {
    mesh.position.set(pos.x, groundHeight(pos.x, pos.z), pos.z);
  }

  return {
    sync(client: Client | null) {
      if (client && (!present || leaving)) {
        present = true;
        leaving = false;
        look = client.look;
        pos = ENTRY;
        path = route(STALL_SPOT);
        mesh.visible = true;
        place();
      } else if (!client && present && !leaving) {
        leaving = true;
        path = [{ x: pos.x, z: ROAD_Z }, ENTRY];
      }
    },
    update(dt: number) {
      if (!present) return;
      const { views } = sets[look];
      let moving = false;
      let left = SPEED * dt;
      while (path.length && left > 0) {
        const to = path[0];
        const d = Math.hypot(to.x - pos.x, to.z - pos.z);
        if (d <= left) {
          pos = to;
          left -= d;
          path.shift();
        } else {
          dir = { x: (to.x - pos.x) / d, z: (to.z - pos.z) / d };
          pos = { x: pos.x + dir.x * left, z: pos.z + dir.z * left };
          left = 0;
        }
        moving = true;
      }
      if (!path.length && leaving) {
        present = false;
        mesh.visible = false;
        return;
      }
      walkT = moving ? walkT + dt : 0;
      const vertical = Math.abs(dir.z) > Math.abs(dir.x);
      const view = views[vertical ? (dir.z < 0 ? "up" : "down") : "side"];
      const idle = !moving ? views.down.idle : null;
      const map = idle ?? view.walk[Math.floor(walkT / STEP_FRAME_S) % view.walk.length];
      if (mat.map !== map) mat.map = map;
      mesh.scale.x = vertical ? 1 : Math.sign(dir.x);
      place();
    },
    waiting(): Point | null {
      return present && !leaving && !path.length ? STALL_SPOT : null;
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mat.dispose();
      sets.forEach((s) => s.textures.forEach((t) => t.dispose()));
    },
  };
}

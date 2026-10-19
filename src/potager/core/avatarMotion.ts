import { MAP } from "./catalog/map";
import type { Point } from "./types";
import { nearestWalkable, type Walkable } from "./walk";

export const AVATAR_SPEED = 4.5;

export interface AvatarPose {
  x: number;
  z: number;
  moving: boolean;
  // -1 : tourné vers la gauche
  facing: 1 | -1;
  // direction unitaire du dernier déplacement (vers la caméra au départ)
  dir: Point;
}

export interface AvatarMotion {
  pose(): AvatarPose;
  setInput(dx: number, dz: number): void;
  walkTo(path: Point[]): void;
  teleport(p: Point): void;
  // replace l'avatar si le sol sous lui est devenu bloqué (bâtiment acheté dessus)
  unstick(): void;
  update(dt: number): AvatarPose;
}

export function createAvatarMotion(
  start: Point,
  walkable: Walkable,
  speed = AVATAR_SPEED,
): AvatarMotion {
  const place = (p: Point) => nearestWalkable(p, walkable, 3) ?? { ...MAP.spawn };
  let { x, z } = place(start);
  let facing: 1 | -1 = 1;
  let dir: Point = { x: 0, z: 1 };
  let moving = false;
  let input = { x: 0, z: 0 };
  let path: Point[] = [];

  const face = (dx: number) => {
    if (dx) facing = dx < 0 ? -1 : 1;
  };
  const pose = (): AvatarPose => ({ x, z, moving, facing, dir });

  return {
    pose,
    setInput(dx, dz) {
      const len = Math.hypot(dx, dz);
      input = len ? { x: dx / len, z: dz / len } : { x: 0, z: 0 };
      if (len) path = [];
    },
    walkTo(p) {
      path = [...p];
    },
    teleport(p) {
      ({ x, z } = place(p));
      path = [];
    },
    unstick() {
      if (!walkable(x, z)) ({ x, z } = place({ x, z }));
    },
    update(dt) {
      const x0 = x,
        z0 = z;
      if (input.x || input.z) {
        const nx = x + input.x * speed * dt;
        if (walkable(nx, z)) x = nx;
        const nz = z + input.z * speed * dt;
        if (walkable(x, nz)) z = nz;
        face(input.x);
      } else {
        let left = speed * dt;
        while (path.length && left > 0) {
          const to = path[0];
          const d = Math.hypot(to.x - x, to.z - z);
          face(to.x - x);
          if (d <= left) {
            ({ x, z } = to);
            left -= d;
            path.shift();
          } else {
            x += ((to.x - x) / d) * left;
            z += ((to.z - z) / d) * left;
            left = 0;
          }
        }
      }
      moving = x !== x0 || z !== z0;
      if (moving) {
        const len = Math.hypot(x - x0, z - z0);
        dir = { x: (x - x0) / len, z: (z - z0) / len };
      }
      return pose();
    },
  };
}

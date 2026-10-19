import type { TreeSpot } from "../core/catalog/map";
import type { Point } from "../core/types";
import { TILT_DEG } from "./cameraRig";

const TAN_TILT = Math.tan((TILT_DEG * Math.PI) / 180);
const AVATAR_HALF_W = 0.5;

// Vu de la caméra, un point au sol à la profondeur d derrière l'arbre apparaît
// à la hauteur d * tan(inclinaison) sur le sprite : caché tant que c'est sous la cime.
export function hidesAvatar(tree: TreeSpot, p: Point, groundY: number): boolean {
  const depth = tree.z - p.z;
  if (depth <= 0) return false;
  if (Math.abs(p.x - tree.x) > tree.size * 0.375 + AVATAR_HALF_W) return false;
  return groundY - tree.y + depth * TAN_TILT < tree.size;
}

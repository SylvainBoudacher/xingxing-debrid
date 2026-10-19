import type { PotagerSave } from "../core/types";
import type { PotagerScene } from "../render/createPotagerScene";

// caméra et avatar de la scène, recopiés dans la sauvegarde
export const withView =
  (scene: PotagerScene) =>
  (s: PotagerSave): PotagerSave => {
    const { x, z } = scene.avatar.pose();
    return { ...s, camera: { ...scene.rig.target(), mode: scene.rig.mode() }, avatar: { x, z } };
  };

export const moved = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z) >= 0.01;

import { useEffect } from "react";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { moved, withView } from "./viewSave";

const VIEW_SAVE_MS = 2000;
export const ENTER_S = 1.6;
export const EXIT_S = 1.2;

// Entrée dans le jeu : la caméra plonge depuis la vue aérienne du fond ; sortie : elle remonte.
// Entre les deux, la vue (caméra, avatar) est recopiée dans la sauvegarde.
export function useGameView(scene: PotagerScene, host: SimHost) {
  useEffect(() => {
    const save = host.state();
    scene.setMode("potager");
    if (save) scene.rig.reset(save.camera);
    scene.rig.liftTo(0, ENTER_S);

    let savedCamera = scene.rig.target();
    let savedAvatar = scene.avatar.pose();
    const id = setInterval(() => {
      const camera = scene.rig.target(),
        avatar = scene.avatar.pose();
      if (!moved(camera, savedCamera) && !moved(avatar, savedAvatar)) return;
      savedCamera = camera;
      savedAvatar = avatar;
      host.update(withView(scene));
    }, VIEW_SAVE_MS);

    return () => {
      clearInterval(id);
      host.update(withView(scene));
      scene.setMode("backdrop");
      scene.rig.setMode("free");
      scene.rig.liftTo(1, EXIT_S);
    };
  }, [scene, host]);
}

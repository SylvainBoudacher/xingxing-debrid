import { useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "../core/types";
import { hasWebgl } from "../render/webgl";
import { AbriPanel } from "./AbriPanel";
import { AvatarBubble } from "./AvatarBubble";
import { InventoryBar } from "./InventoryBar";
import { MinigameOverlay } from "./minigames/MinigameOverlay";
import { loadPotagerFont } from "./potagerFont";
import { PotagerHud } from "./PotagerHud";
import { PotagerToaster } from "./PotagerToaster";
import { useAvatarControls } from "./useAvatarControls";
import { useFreeCamera } from "./useFreeCamera";
import { useGardenActions } from "./useGardenActions";
import { useHostState } from "./useHostState";
import { usePotagerSession } from "./usePotagerSession";

export default function PotagerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglOk] = useState(hasWebgl);
  const { scene, canvas, mode, failed, applyMode, host } = usePotagerSession(canvasRef, webglOk);
  const save = useHostState(host);
  const garden = useGardenActions(scene, host);

  useEffect(loadPotagerFont, []);

  const follow = useCallback(() => applyMode("follow"), [applyMode]);
  useFreeCamera(scene?.rig ?? null, canvas);
  useAvatarControls(scene, canvas, follow, {
    locked: garden.locked,
    interceptClick: garden.interceptClick,
    onManualMove: garden.cancelPending,
  });

  const project = useCallback((p: Point) => scene!.project(p), [scene]);
  const avatarOnScreen = useCallback(() => scene!.project(scene!.avatar.pose()), [scene]);

  function toggleMode() {
    if (scene) applyMode(scene.rig.mode() === "follow" ? "free" : "follow");
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1410] select-none">
      <PotagerToaster />
      {failed ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#f1e6d2]">
          Le Potager n'a pas pu être chargé.
        </div>
      ) : webglOk ? (
        <>
          <canvas ref={canvasRef} className="block h-full w-full" />
          {scene && <PotagerHud mode={mode} onToggleMode={toggleMode} />}
          {scene && save && (
            <InventoryBar
              inventory={save.inventory}
              selected={garden.selected}
              onSelect={garden.select}
            />
          )}
          {scene && garden.game && (
            <MinigameOverlay active={garden.game} project={project} onDone={garden.finish} />
          )}
          {scene && garden.bubble && <AvatarBubble text={garden.bubble} where={avatarOnScreen} />}
          {save && garden.abriOpen && (
            <AbriPanel
              save={save}
              onDeposit={garden.deposit}
              onWithdrawTool={garden.withdrawTool}
              onWithdrawStack={garden.withdrawStack}
              onClose={garden.closeAbri}
            />
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#f1e6d2]">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      )}
    </div>
  );
}

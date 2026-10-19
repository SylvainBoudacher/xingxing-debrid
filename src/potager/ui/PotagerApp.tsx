import { useCallback, useEffect, useRef, useState } from "react";
import { hasWebgl } from "../render/webgl";
import { loadPotagerFont } from "./potagerFont";
import { PotagerHud } from "./PotagerHud";
import { PotagerToaster } from "./PotagerToaster";
import { useAvatarControls } from "./useAvatarControls";
import { useFreeCamera } from "./useFreeCamera";
import { usePotagerSession } from "./usePotagerSession";

export default function PotagerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglOk] = useState(hasWebgl);
  const { scene, canvas, mode, failed, applyMode } = usePotagerSession(canvasRef, webglOk);

  useEffect(loadPotagerFont, []);

  const follow = useCallback(() => applyMode("follow"), [applyMode]);
  useFreeCamera(scene?.rig ?? null, canvas);
  useAvatarControls(scene, canvas, follow);

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
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#f1e6d2]">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      )}
    </div>
  );
}

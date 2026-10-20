import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { CameraMode, Point } from "../core/types";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { MAP } from "../core/catalog/map";
import { flowerDataUrl } from "../textures/flowers";
import { AvatarBubble } from "./AvatarBubble";
import { demandLabel } from "./demandLabel";
import { GainPop } from "./GainPop";
import { GardenPanels } from "./GardenPanels";
import { HerbierPanel } from "./HerbierPanel";
import { InventoryBar } from "./InventoryBar";
import { MinigameOverlay } from "./minigames/MinigameOverlay";
import { loadPotagerFont } from "./potagerFont";
import { PotagerHud } from "./PotagerHud";
import { PotagerToaster } from "./PotagerToaster";
import { useAvatarControls } from "./useAvatarControls";
import { useBloomAnnounce } from "./useBloomAnnounce";
import { useEconomy } from "./useEconomy";
import { useFreeCamera } from "./useFreeCamera";
import { useGardenActions } from "./useGardenActions";
import { ENTER_S, useGameView } from "./useGameView";
import { useHostState } from "./useHostState";
import { withView } from "./viewSave";

// Interface du jeu, posée sur la scène du fond pendant qu'on joue.
export function PotagerGame({
  scene,
  canvas,
  host,
  onExit,
}: {
  scene: PotagerScene;
  canvas: HTMLCanvasElement;
  host: SimHost;
  onExit: () => void;
}) {
  useGameView(scene, host);
  const save = useHostState(host);
  const [mode, setMode] = useState<CameraMode>(() => host.state()?.camera.mode ?? "follow");
  const [herbierOpen, setHerbierOpen] = useState(false);
  const garden = useGardenActions(scene, host, herbierOpen);
  const eco = useEconomy(host, garden.say);
  const [pop, setPop] = useState<{ gain: number; id: number } | null>(null);
  const busy = !!garden.game || garden.panel !== null;
  useBloomAnnounce(scene, host);

  // H : ouvrir ou fermer l'Herbier ; Échap : le fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.code === "KeyH" && !busy) setHerbierOpen((o) => !o);
      if (e.code === "Escape") setHerbierOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [busy]);

  useEffect(loadPotagerFont, []);

  const applyMode = useCallback(
    (next: CameraMode) => {
      scene.rig.setMode(next);
      setMode(next);
      host.update(withView(scene));
    },
    [scene, host],
  );
  const follow = useCallback(() => applyMode("follow"), [applyMode]);
  useFreeCamera(scene.rig, canvas);
  useAvatarControls(scene, canvas, follow, {
    locked: garden.locked,
    interceptClick: garden.interceptClick,
    onManualMove: garden.cancelPending,
  });

  const project = useCallback((p: Point) => scene.project(p), [scene]);
  const avatarOnScreen = useCallback(() => scene.project(scene.avatar.pose()), [scene]);
  const clientOnScreen = useCallback(() => {
    const p = scene.clientSpot();
    return p ? scene.project(p) : { x: -9999, y: -9999 };
  }, [scene]);
  const etalOnScreen = useCallback(
    () => scene.project(MAP.buildings.find((b) => b.id === "etal")!),
    [scene],
  );

  // servir ferme le panneau, joue le ruban, puis encaisse
  const { closePanel, play } = garden;
  const serve = useCallback(
    (stallIndex: number) => {
      closePanel();
      play("servir", (r) => {
        const gain = eco.serve(stallIndex, r.grade);
        if (gain !== null) setPop({ gain, id: Date.now() });
      });
    },
    [closePanel, play, eco],
  );

  return (
    <motion.div
      className="potager-game pointer-events-none absolute inset-0 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, delay: ENTER_S * 0.7 } }}
    >
      <PotagerToaster />
      <PotagerHud
        mode={mode}
        onToggleMode={() => applyMode(mode === "follow" ? "free" : "follow")}
        onHerbier={() => setHerbierOpen((o) => !o)}
        herbierDisabled={busy}
        po={save?.po ?? 0}
        onExit={onExit}
      />
      {save && (
        <InventoryBar
          inventory={save.inventory}
          selected={garden.selected}
          onSelect={garden.select}
        />
      )}
      {garden.game && (
        <MinigameOverlay active={garden.game} project={project} onDone={garden.finish} />
      )}
      {garden.bubble && <AvatarBubble text={garden.bubble} where={avatarOnScreen} />}
      {save?.client && !busy && !herbierOpen && (
        <AvatarBubble
          text={demandLabel(save.client.demand)}
          icon={flowerDataUrl(save.client.demand.species, save.client.demand.color)}
          where={clientOnScreen}
        />
      )}
      {pop && (
        <GainPop key={pop.id} gain={pop.gain} where={etalOnScreen} onDone={() => setPop(null)} />
      )}
      {save && herbierOpen && <HerbierPanel save={save} onClose={() => setHerbierOpen(false)} />}
      {save && <GardenPanels save={save} garden={garden} eco={eco} onServe={serve} />}
    </motion.div>
  );
}

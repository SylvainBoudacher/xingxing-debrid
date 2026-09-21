import * as THREE from "three";
import { spawnLeaves } from "../core/leaves";
import { fieldRect } from "../core/plots";
import type { GardenSave, PlotId, TileKey } from "../core/types";
import { spriteCanvas } from "../sprites/sprite";
import { createAmbience } from "./ambience";
import { createBillboards } from "./billboards";
import { createCameraRig, type CameraRig } from "./camera";
import { framing, VIEWS, type SceneProfile } from "./framing";
import { createGround } from "./ground";
import { createInteraction, type GardenInteraction } from "./interaction";
import { createLighting } from "./lighting";
import { createGroundProbe } from "./picking";
import { createPost } from "./post";
import { buildSceneModel, diffItems, type SceneItem } from "./sceneModel";
import { todOf, type Tod } from "./tod";
import { wx, wz } from "./world";

export interface GardenScene {
  start(): void;
  stop(): void;
  readonly running: boolean;
  readonly fps: number;
  sync(save: GardenSave, now: number): void;
  renderOnce(): void;
  dispose(): void;
  readonly interaction?: GardenInteraction;
  readonly camera?: GardenCamera;
  // force une ambiance (outil de développement) ; null = heure réelle
  setTod(tod: Tod | null): void;
}

// Commandes de cadrage manuel exposées à l'interface (fenêtre Potager seulement).
export interface GardenCamera {
  // (dx, dz) en unités monde : ce que la sonde de sol a mesuré sous le curseur
  pan(dx: number, dz: number): void;
  zoomBy(delta: number): void;
  // direction clavier appliquée à chaque image tant qu'une touche est tenue
  setNudge(dir: { x: number; z: number } | null): void;
  reset(): void;
  groundAt(clientX: number, clientY: number): { x: number; z: number } | null;
  readonly moved: boolean;
}

// 30 images/s suffisent à un décor qui respire ; un cadrage qui se déplace à 30 saute.
const FRAME_MS = 1000 / 30;
const MOVING_FRAME_MS = 1000 / 60;

const TREES: [number, number][] = [
  [-3.2, -3.3],
  [-0.6, -3.9],
  [2.4, -3.4],
  [5.3, -3.8],
  [7.8, -3.2],
  [-6.5, -1.2],
  [8.9, 0.6],
];

// Scène HD-2D : sprites pixel art debout dans une scène 3D éclairée, bridée à 30 images/s.
export function createGardenScene(canvas: HTMLCanvasElement, profile: SceneProfile): GardenScene {
  const base = VIEWS[profile];
  let view = framing(base, fieldRect(["p1"]));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
  const look = new THREE.Vector3(...view.look);

  const ground = createGround(scene);
  const billboards = createBillboards(scene);
  const ambience = createAmbience(scene);
  const lighting = createLighting(scene);
  const rig: CameraRig = createCameraRig(view, fieldRect(["p1"]));
  const reframe = (plots: PlotId[]) => {
    const rect = fieldRect(plots);
    view = framing(base, rect);
    rig.setFrame(view, rect);
    lighting.setScale(view.scale);
  };
  const post = createPost(renderer, scene, camera);
  const interaction =
    profile === "garden"
      ? createInteraction(scene, camera, canvas, billboards, () => plots)
      : undefined;
  const probe = profile === "garden" ? createGroundProbe(camera, canvas) : undefined;
  let nudge: { x: number; z: number } | null = null;
  const controls: GardenCamera | undefined = probe && {
    pan: rig.pan,
    zoomBy: rig.zoomBy,
    setNudge(dir) {
      nudge = dir;
    },
    reset: rig.reset,
    groundAt: probe.at,
    get moved() {
      return rig.moved;
    },
  };

  const fence = spriteCanvas({ name: "cloture" });
  for (let tx = -2; tx < 15; tx++)
    billboards.addStatic(fence, wx(tx), wz(-1) + 0.2, 1, 1.5, false, 0);
  const tree = spriteCanvas({ name: "arbre" });
  TREES.forEach(([x, z], i) => billboards.addStatic(tree, x, z, 3, 4.5, true, i));

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    post.resize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let mx = 0;
  let my = 0;
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  };
  if (view.parallax) window.addEventListener("pointermove", onPointer);

  let plots: PlotId[] = ["p1"];
  let shown = new Map<TileKey, SceneItem>();
  let raining = false;
  let forcedTod: Tod | null = null;

  function sync(save: GardenSave, now: number) {
    // idempotent : le fond passif affiche les mêmes tas que le Potager sans écrire
    if (save.plots.length !== plots.length) reframe(save.plots);
    plots = save.plots;
    const model = buildSceneModel(spawnLeaves(save, now), now);
    const { remove, add } = diffItems(shown, model.items);
    remove.forEach((k) => billboards.remove(k));
    add.forEach((k) => billboards.add(k, model.items.get(k)!));
    shown = model.items;
    ground.setSoil(model.soil);
    ground.setWet(model.wet);
    ground.setDry(model.dry);
    raining = model.raining;
  }

  let lastT = 0;
  function draw(ms: number) {
    const t = ms / 1000;
    const dt = lastT ? Math.min(0.1, Math.max(0, t - lastT)) : 0;
    lastT = t;
    if (nudge) rig.nudge(dt, nudge);
    const pose = rig.pose();
    const tod = forcedTod ?? todOf(new Date());
    const L = lighting.apply(tod, raining, {
      renderer,
      bloom: post.bloom,
      ambience,
      lanterns: billboards.lanterns(),
      setGroundRaining: ground.setRaining,
    });
    // légère dérive automatique ; la parallaxe souris n'existe que dans la fenêtre Potager.
    // Dès que le joueur cadre lui-même, les deux se taisent : elles lui reprendraient la main.
    const drift = rig.moved ? 0 : mx * view.parallax + Math.sin(t * 0.1) * 0.3;
    const tilt = rig.moved ? 0 : my * 0.8 * (view.parallax ? 1 : 0);
    camera.position.set(pose.x + drift, pose.y - tilt, pose.z);
    look.set(...pose.look);
    camera.lookAt(look);
    billboards.sway(t, raining);
    billboards.updateFx(t, dt, tod === "nuit");
    interaction?.update(t);
    ambience.update(t, L.mist, camera);
    post.composer.render();
  }

  let running = false;
  let raf = 0;
  let lastDraw = 0;
  let frames = 0;
  let fpsT = 0;
  let fps = 0;

  function frame(ms: number) {
    raf = requestAnimationFrame(frame);
    const budget = rig.moving(ms) ? MOVING_FRAME_MS : FRAME_MS;
    if (ms - lastDraw < budget - 2) return;
    lastDraw = ms;
    frames++;
    if (ms - fpsT >= 1000) {
      fps = Math.round((frames * 1000) / (ms - fpsT));
      frames = 0;
      fpsT = ms;
    }
    draw(ms);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  return {
    start() {
      if (running) return;
      running = true;
      frames = 0;
      fpsT = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop,
    get running() {
      return running;
    },
    get fps() {
      return running ? fps : 0;
    },
    sync,
    interaction,
    camera: controls,
    setTod(tod) {
      forcedTod = tod;
    },
    renderOnce() {
      draw(performance.now());
    },
    dispose() {
      stop();
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      interaction?.dispose();
      billboards.dispose();
      ground.dispose();
      ambience.dispose();
      post.dispose();
      renderer.dispose();
    },
  };
}

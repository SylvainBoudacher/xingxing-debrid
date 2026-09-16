import * as THREE from "three";
import { spawnLeaves } from "../core/leaves";
import type { GardenSave, TileKey } from "../core/types";
import { spriteCanvas } from "../sprites/sprite";
import { createAmbience } from "./ambience";
import { createBillboards } from "./billboards";
import { createGround } from "./ground";
import { createInteraction, type GardenInteraction } from "./interaction";
import { createLighting } from "./lighting";
import { createPost } from "./post";
import { buildSceneModel, diffItems, type SceneItem } from "./sceneModel";
import { todOf } from "./tod";
import { wx, wz } from "./world";

export type SceneProfile = "backdrop" | "garden";

export interface GardenScene {
  start(): void;
  stop(): void;
  readonly running: boolean;
  readonly fps: number;
  sync(save: GardenSave, now: number): void;
  renderOnce(): void;
  dispose(): void;
  readonly interaction?: GardenInteraction;
}

const FRAME_MS = 1000 / 30;

const VIEWS: Record<
  SceneProfile,
  { y: number; z: number; look: [number, number, number]; parallax: number }
> = {
  backdrop: { y: 6.2, z: 11.5, look: [0, 0.9, -0.6], parallax: 0 },
  garden: { y: 7.4, z: 11.8, look: [0.9, 0.2, 0.6], parallax: 0.6 },
};

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
  const view = VIEWS[profile];
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
  const post = createPost(renderer, scene, camera);
  const interaction =
    profile === "garden" ? createInteraction(scene, camera, canvas, billboards) : undefined;

  const fence = spriteCanvas({ name: "cloture" });
  for (let tx = -2; tx < 10; tx++)
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

  let shown = new Map<TileKey, SceneItem>();
  let raining = false;

  function sync(save: GardenSave, now: number) {
    // idempotent : le fond passif affiche les mêmes tas que le Potager sans écrire
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

  function draw(ms: number) {
    const t = ms / 1000;
    const L = lighting.apply(todOf(new Date()), raining, {
      renderer,
      bloom: post.bloom,
      ambience,
      lanterns: billboards.lanterns(),
      setGroundRaining: ground.setRaining,
    });
    // légère dérive automatique ; la parallaxe souris n'existe que dans la fenêtre Potager
    const cx = mx * view.parallax + Math.sin(t * 0.1) * 0.3;
    camera.position.set(cx + view.look[0], view.y - my * 0.8 * (view.parallax ? 1 : 0), view.z);
    camera.lookAt(look);
    billboards.sway(t, raining);
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
    if (ms - lastDraw < FRAME_MS - 2) return;
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

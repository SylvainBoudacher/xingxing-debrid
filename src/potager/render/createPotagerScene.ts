import * as THREE from "three";
import { groundHeight, MAP } from "../core/catalog/map";
import { createAvatarMotion, type AvatarMotion } from "../core/avatarMotion";
import type { BuildingId, Point, PotagerSave } from "../core/types";
import { isWalkable, type Walkable } from "../core/walk";
import { createCameraRig, DISTANCE, FOV, fovFor, type CameraRig } from "./cameraRig";
import type { Target } from "../core/actions";
import { createBloom } from "./bloom";
import { buildGarden, disposeGarden, type GardenView } from "./garden";
import { gardenKey } from "./gardenKey";
import { createClients } from "./clients";
import { createStaff } from "./staff";
import { createHighlight } from "./highlight";
import { crowTex } from "../textures/pests";
import { createParticles } from "./particles";
import { createPost } from "./post";
import { buildTerrain } from "./terrain";
import { hidesAvatar } from "./occlusion";
import { lightingAt } from "./tod";
import { buildAvatar, buildDecor, buildPlaced, type Lantern } from "./village";

export type SceneMode = "potager" | "backdrop";

export interface PotagerScene {
  sync(save: PotagerSave): void;
  // fond -> jeu : ombres fines, 60 i/s, éclosions ; jeu -> fond : l'inverse
  setMode(mode: SceneMode): void;
  rig: CameraRig;
  avatar: AvatarMotion;
  walkable: Walkable;
  pick(clientX: number, clientY: number): Point | null;
  // coordonnées écran (CSS) d'un point au sol
  project(p: Point): { x: number; y: number; visible: boolean };
  // appelé quand une éclosion pas encore vue vient d'être montrée au joueur
  onBloomSeen(cb: (cellKey: string) => void): () => void;
  // élément du jardin où une action est possible (ou rien)
  setHighlight(t: Target | null): void;
  // client arrivé devant l'étal (ou rien)
  clientSpot(): Point | null;
  start(): void;
  stop(): void;
  renderOnce(): void;
  resize(): void;
  dispose(): void;
}

const SUN_OFFSET = new THREE.Vector3(-12, 18, 9);
const LIGHTING_EVERY_MS = 60_000;
// cycle de course de 8 frames : deux foulées en 0,6 s
const STEP_FRAME_S = 0.075;
const TREE_FADED = 0.45;
const TREE_FADE_PER_S = 4;
const FOG_NEAR = 30;
const FOG_FAR = 62;
const SHADOW_SIZE: Record<SceneMode, number> = { potager: 4096, backdrop: 2048 };
// 120 Hz sur les écrans ProMotion : plafonné, l'image ne gagne rien à aller plus vite
const MIN_FRAME_MS: Record<SceneMode, number> = { potager: 1000 / 60 - 1, backdrop: 1000 / 30 - 1 };

export function createPotagerScene(
  canvas: HTMLCanvasElement,
  initialMode: SceneMode,
  init: PotagerSave,
): PotagerScene {
  let mode = initialMode;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const post = createPost(renderer);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog("#c9b892", FOG_NEAR, FOG_FAR);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 1, 140);

  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(SHADOW_SIZE[mode]);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 1,
    far: 70,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const terrain = buildTerrain();
  const decor = buildDecor();
  scene.add(terrain.group, decor.group);
  const sprite = buildAvatar();
  scene.add(sprite.mesh);
  let buildings: readonly BuildingId[] = init.buildings;
  const walkable: Walkable = (x, z) => isWalkable(x, z, buildings);
  const avatar = createAvatarMotion(init.avatar, walkable);
  const raycaster = new THREE.Raycaster();
  const particles = createParticles(scene);
  const bloom = createBloom(scene);
  const highlight = createHighlight(scene);
  const clients = createClients(scene);
  const staff = createStaff(scene);
  let garden: GardenView | null = null;
  let gKey = "";
  let lastSave = init;
  const bloomListeners = new Set<(cellKey: string) => void>();
  const blooming = new Set<string>();

  let placed: { group: THREE.Group; lanterns: Lantern[] } | null = null;
  let placedKey = "";
  let lanternsOn = false;

  function applyLighting() {
    const l = lightingAt(new Date().getHours() + new Date().getMinutes() / 60);
    sun.color.set(l.sun);
    sun.intensity = l.sunIntensity;
    hemi.color.set(l.sky);
    hemi.groundColor.set(l.ground);
    hemi.intensity = l.hemi;
    fog.color.set(l.fog);
    scene.background = new THREE.Color(l.fog);
    lanternsOn = l.lanterns;
    placed?.lanterns.forEach((x) => (x.glow.visible = lanternsOn));
  }

  const rig = createCameraRig(init.camera, MAP.bounds, groundHeight);
  if (mode === "backdrop") rig.liftTo(1, 0);

  function sync(save: PotagerSave) {
    buildings = save.buildings;
    // dans la fenêtre Potager, la scène fait foi pour l'avatar
    if (mode === "backdrop") avatar.teleport(save.avatar);
    else avatar.unstick();
    lastSave = save;
    clients.sync(save.client);
    staff.sync(save);
    for (const k of blooming) {
      const c = save.cells[k];
      if (c?.kind !== "plante" || c.seen) blooming.delete(k);
    }
    const k = gardenKey(save);
    if (k !== gKey) {
      gKey = k;
      if (garden) {
        scene.remove(garden.group);
        disposeGarden(garden);
      }
      garden = buildGarden(save);
      scene.add(garden.group);
      bloom.rebind(garden.flowers);
    }
    const key = `${save.buildings.join()}|${save.parcels.join()}`;
    if (key === placedKey) return;
    placedKey = key;
    if (placed) {
      scene.remove(placed.group);
      disposeTree(placed.group);
    }
    placed = buildPlaced(save);
    scene.add(placed.group);
    placed.lanterns.forEach((x) => (x.glow.visible = lanternsOn));
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)),
      h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    renderer.setSize(w, h, false);
    post.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = fovFor(camera.aspect);
    camera.updateProjectionMatrix();
    // setSize efface le tampon : sans boucle en cours, rien ne redessinerait l'image
    if (!raf) frame(0);
  }

  // les arbres devant l'avatar s'estompent pour le laisser voir
  function fadeTrees(p: Point, py: number, dt: number) {
    const step = TREE_FADE_PER_S * dt;
    for (const { spot, mesh } of decor.trees) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      const goal = hidesAvatar(spot, p, py) ? TREE_FADED : 1;
      mat.opacity =
        goal < mat.opacity
          ? Math.max(goal, mat.opacity - step)
          : Math.min(goal, mat.opacity + step);
      mat.transparent = mat.opacity < 1;
    }
  }

  // une éclosion pas encore vue se joue dès que sa case est à l'écran
  function showBlooms() {
    // sans abonné (interface pas encore montée), l'éclosion attend : elle ne doit pas être perdue
    if (!garden || !bloomListeners.size) return;
    for (const [key, mesh] of garden.flowers) {
      const c = lastSave.cells[key];
      if (c?.kind !== "plante" || c.seen || blooming.has(key)) continue;
      if (!project({ x: mesh.position.x, z: mesh.position.z }).visible) continue;
      blooming.add(key);
      bloom.play(key, mesh);
      bloomListeners.forEach((cb) => cb(key));
    }
  }

  const projected = new THREE.Vector3();
  function project(p: Point) {
    projected.set(p.x, groundHeight(p.x, p.z), p.z).project(camera);
    const r = canvas.getBoundingClientRect();
    return {
      x: r.left + ((projected.x + 1) / 2) * r.width,
      y: r.top + ((1 - projected.y) / 2) * r.height,
      visible: Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.95 && projected.z < 1,
    };
  }

  let t = 0;
  let walkT = 0;
  function frame(dt: number) {
    t += dt;
    const p = avatar.update(dt);
    const py = groundHeight(p.x, p.z);
    walkT = p.moving ? walkT + dt : 0;
    const view = sprite.views[p.view];
    const step = Math.floor(walkT / STEP_FRAME_S) % view.walk.length;
    const map = p.moving ? view.walk[step] : view.idle;
    sprite.mesh.position.set(p.x, py, p.z);
    sprite.mesh.scale.x = p.view === "side" ? p.facing : 1;
    const mat = sprite.mesh.material as THREE.MeshLambertMaterial;
    if (mat.map !== map) mat.map = map;
    fadeTrees(p, py, dt);
    if (mode === "potager") showBlooms();
    bloom.update(dt);
    // corneilles : ailes qui battent doucement
    const wing = crowTex(Math.floor(t / 0.4) % 2 ? 1 : 0);
    garden?.crows.forEach((m) => ((m.material as THREE.MeshLambertMaterial).map = wing));
    highlight.update(t);
    clients.update(dt);
    staff.update(dt);
    if (rig.mode() === "follow") rig.follow(p);
    rig.update(dt);
    const { position, look, distance } = rig.pose();
    // le brouillard recule avec la caméra : la vue aérienne ne doit pas être délavée
    fog.near = FOG_NEAR + distance - DISTANCE;
    fog.far = FOG_FAR + distance - DISTANCE;
    camera.position.set(...position);
    camera.lookAt(...look);
    sun.target.position.set(look[0], 0, look[2]);
    sun.position.copy(sun.target.position).add(SUN_OFFSET);
    terrain.tick(t);
    placed?.lanterns.forEach(
      (x) =>
        (x.light.intensity = lanternsOn ? 3 + Math.sin(t * 7) * 0.4 + Math.sin(t * 13) * 0.3 : 0),
    );
    particles.update(dt, t, rig.target());
    post.render(scene, camera);
  }

  let raf = 0;
  let last = 0;
  let lastLighting = 0;
  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    if (now - last < MIN_FRAME_MS[mode]) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (now - lastLighting > LIGHTING_EVERY_MS) {
      lastLighting = now;
      applyLighting();
    }
    frame(dt);
  }

  sync(init);
  applyLighting();
  resize();

  return {
    sync,
    setMode(next) {
      if (next === mode) return;
      mode = next;
      // la shadow map est réallouée à la bonne taille au prochain rendu
      sun.shadow.mapSize.setScalar(SHADOW_SIZE[mode]);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      if (mode === "potager") avatar.unstick();
    },
    rig,
    avatar,
    walkable,
    project,
    setHighlight: highlight.set,
    clientSpot: clients.waiting,
    onBloomSeen(cb) {
      bloomListeners.add(cb);
      return () => bloomListeners.delete(cb);
    },
    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((clientX - r.left) / r.width) * 2 - 1,
          -((clientY - r.top) / r.height) * 2 + 1,
        ),
        camera,
      );
      const targets = [
        terrain.group,
        ...decor.props,
        ...(garden ? garden.forest : []),
        ...(garden ? garden.crows : []),
        ...(placed ? [placed.group] : []),
      ];
      const hit = raycaster.intersectObjects(targets, true)[0];
      if (!hit) return null;
      // une corneille se vise à son oiseau : on renvoie la case sous elle, pas le sol derrière
      const at = garden?.crows.includes(hit.object as THREE.Mesh) ? hit.object.position : hit.point;
      return { x: at.x, z: at.z };
    },
    start() {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    renderOnce() {
      frame(0);
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (garden) {
        scene.remove(garden.group);
        disposeGarden(garden);
      }
      bloom.dispose();
      highlight.dispose();
      clients.dispose();
      staff.dispose();
      disposeTree(scene);
      // hors de l'arbre : la frame d'avatar inactive et la shadow map
      sprite.textures.forEach((t) => t.dispose());
      sun.shadow.dispose();
      post.dispose();
      renderer.dispose();
    },
  };
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}

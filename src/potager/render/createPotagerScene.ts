import * as THREE from "three";
import { groundHeight, MAP } from "../core/catalog/map";
import { createAvatarMotion, type AvatarMotion } from "../core/avatarMotion";
import type { BuildingId, Point, PotagerSave } from "../core/types";
import { isWalkable, type Walkable } from "../core/walk";
import { createCameraRig, FOV, FOV_NARROW, type CameraRig } from "./cameraRig";
import { createParticles } from "./particles";
import { createPost } from "./post";
import { buildTerrain } from "./terrain";
import { lightingAt } from "./tod";
import { buildAvatar, buildDecor, buildPlaced, type Lantern } from "./village";

export type SceneMode = "potager" | "backdrop";

export interface PotagerScene {
  sync(save: PotagerSave): void;
  rig: CameraRig;
  avatar: AvatarMotion;
  walkable: Walkable;
  pick(clientX: number, clientY: number): Point | null;
  start(): void;
  stop(): void;
  renderOnce(): void;
  resize(): void;
  dispose(): void;
}

const SUN_OFFSET = new THREE.Vector3(-12, 18, 9);
const LIGHTING_EVERY_MS = 60_000;
const STEP_FRAME_S = 0.18;

export function createPotagerScene(
  canvas: HTMLCanvasElement,
  mode: SceneMode,
  init: PotagerSave,
): PotagerScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const post = createPost(renderer);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#c9b892", 30, 62);
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 1, 140);

  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  const size = mode === "potager" ? 4096 : 2048;
  sun.castShadow = true;
  sun.shadow.mapSize.set(size, size);
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
  scene.add(terrain.group, buildDecor());
  const sprite = buildAvatar();
  scene.add(sprite.mesh);
  let buildings: readonly BuildingId[] = init.buildings;
  const walkable: Walkable = (x, z) => isWalkable(x, z, buildings);
  const avatar = createAvatarMotion(init.avatar, walkable);
  const raycaster = new THREE.Raycaster();
  const particles = createParticles(scene);

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
    (scene.fog as THREE.Fog).color.set(l.fog);
    scene.background = new THREE.Color(l.fog);
    lanternsOn = l.lanterns;
    placed?.lanterns.forEach((x) => (x.glow.visible = lanternsOn));
  }

  const rig = createCameraRig(init.camera, MAP.bounds, groundHeight);

  function sync(save: PotagerSave) {
    buildings = save.buildings;
    // dans la fenêtre Potager, la scène fait foi pour l'avatar
    if (mode === "backdrop") avatar.teleport(save.avatar);
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
    camera.fov = camera.aspect < 1.3 ? FOV_NARROW : FOV;
    camera.updateProjectionMatrix();
  }

  let t = 0;
  let walkT = 0;
  function frame(dt: number) {
    t += dt;
    const p = avatar.update(dt);
    sprite.mesh.position.set(p.x, groundHeight(p.x, p.z), p.z);
    sprite.mesh.scale.x = p.facing;
    walkT = p.moving ? walkT + dt : 0;
    const map = sprite.frames[Math.floor(walkT / STEP_FRAME_S) % 2];
    const mat = sprite.mesh.material as THREE.MeshLambertMaterial;
    if (mat.map !== map) mat.map = map;
    if (rig.mode() === "follow") rig.follow(p);
    rig.update(dt);
    const { position, look } = rig.pose();
    camera.position.set(...position);
    camera.lookAt(...look);
    sun.target.position.set(look[0], 0, look[2]);
    sun.position.copy(sun.target.position).add(SUN_OFFSET);
    terrain.shimmer.offset.set(t * 0.01, Math.sin(t * 0.4) * 0.02);
    placed?.lanterns.forEach(
      (x) =>
        (x.light.intensity = lanternsOn ? 3 + Math.sin(t * 7) * 0.4 + Math.sin(t * 13) * 0.3 : 0),
    );
    particles.update(dt, t, rig.target());
    post.render(scene, camera);
  }

  const minFrameMs = mode === "backdrop" ? 1000 / 30 - 1 : 0;
  let raf = 0;
  let last = 0;
  let lastLighting = 0;
  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    if (now - last < minFrameMs) return;
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
    rig,
    avatar,
    walkable,
    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((clientX - r.left) / r.width) * 2 - 1,
          -((clientY - r.top) / r.height) * 2 + 1,
        ),
        camera,
      );
      const targets = placed ? [terrain.group, placed.group] : [terrain.group];
      const hit = raycaster.intersectObjects(targets, true)[0];
      return hit ? { x: hit.point.x, z: hit.point.z } : null;
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
      disposeTree(scene);
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

import * as THREE from "three";
import type { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Ambience, SkyColors } from "./ambience";
import type { Lanterns } from "./billboards";
import type { Tod } from "./tod";

export interface Look {
  sunDir: [number, number, number];
  sun: string;
  sunI: number;
  sky: string;
  gnd: string;
  hemiI: number;
  fog: string;
  near: number;
  far: number;
  bloom: number;
  mist: number;
  skyC: SkyColors;
  exp: number;
}

export const LOOKS: Record<Tod, Look> = {
  matin: {
    sunDir: [-6, 3, 4],
    sun: "#ffd2a8",
    sunI: 1.5,
    sky: "#aebcd8",
    gnd: "#5a5a48",
    hemiI: 0.9,
    fog: "#c9d3e2",
    near: 10,
    far: 32,
    bloom: 0.35,
    mist: 0.28,
    skyC: ["#9fb4d6", "#e8e0d8", "#b9c2c8", "#cfd4d8"],
    exp: 1.0,
  },
  midi: {
    sunDir: [-2, 9, 5],
    sun: "#fff3dc",
    sunI: 2.6,
    sky: "#dfe8ff",
    gnd: "#5c6040",
    hemiI: 1.0,
    fog: "#d6e2ec",
    near: 14,
    far: 40,
    bloom: 0.2,
    mist: 0,
    skyC: ["#6fa8e0", "#cfe4f2", "#7ea0a8", "#9fb9b8"],
    exp: 1.0,
  },
  soir: {
    sunDir: [7, 2.2, 2],
    sun: "#ff8a40",
    sunI: 2.6,
    sky: "#f0a080",
    gnd: "#402c40",
    hemiI: 0.65,
    fog: "#e39468",
    near: 14,
    far: 40,
    bloom: 0.55,
    mist: 0,
    skyC: ["#5a4a8a", "#ffa060", "#6a4a60", "#a0606a"],
    exp: 1.05,
  },
  nuit: {
    sunDir: [4, 7, 3],
    sun: "#8ea0e8",
    sunI: 0.9,
    sky: "#5a6aa8",
    gnd: "#1c1c34",
    hemiI: 0.9,
    fog: "#161c34",
    near: 12,
    far: 34,
    bloom: 1.0,
    mist: 0.1,
    skyC: ["#070a1c", "#1c2448", "#10142a", "#181e3a"],
    exp: 1.1,
  },
};

const RAIN_SKY: SkyColors = ["#5a6474", "#9aa4b0", "#58606a", "#6c747e"];
const RAIN_FOG = new THREE.Color("#7a8494");

export interface LightingContext {
  renderer: THREE.WebGLRenderer;
  bloom: UnrealBloomPass;
  ambience: Ambience;
  lanterns: Lanterns;
  setGroundRaining(on: boolean): void;
}

export interface Lighting {
  apply(tod: Tod, raining: boolean, ctx: LightingContext): Look;
}

// Soleil (ou lune), lumière d'ambiance et brouillard, recalculés seulement quand l'ambiance change.
export function createLighting(scene: THREE.Scene): Lighting {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -10,
    right: 10,
    top: 10,
    bottom: -10,
    near: 0.5,
    far: 40,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 3;
  scene.add(hemi, sun, sun.target);
  scene.fog = new THREE.Fog(0xffffff, 10, 30);
  const fog = scene.fog;
  let memo = "";

  return {
    apply(tod, raining, ctx) {
      const L = LOOKS[tod];
      const key = `${tod}:${raining}:${ctx.lanterns.lights.length}`;
      if (key === memo) return L;
      memo = key;
      sun.position.set(...L.sunDir);
      sun.color.set(L.sun);
      sun.intensity = L.sunI * (raining ? 0.45 : 1);
      hemi.color.set(L.sky);
      hemi.groundColor.set(L.gnd);
      hemi.intensity = L.hemiI;
      const fogColor = new THREE.Color(L.fog);
      if (raining) fogColor.lerp(RAIN_FOG, 0.5);
      fog.color.copy(fogColor);
      fog.near = raining ? Math.min(L.near, 9) : L.near;
      fog.far = raining ? Math.min(L.far, 30) : L.far;
      scene.background = fogColor;
      ctx.bloom.strength = L.bloom;
      ctx.renderer.toneMappingExposure = L.exp;
      ctx.ambience.paintSky(raining ? RAIN_SKY : L.skyC);
      ctx.setGroundRaining(raining);
      const night = tod === "nuit";
      ctx.lanterns.lights.forEach((l) => (l.intensity = night ? 4 : tod === "soir" ? 1.2 : 0));
      ctx.lanterns.glows.forEach((g) =>
        g.material.color.setRGB(night ? 5 : 1.4, night ? 3.2 : 1.1, night ? 1.2 : 0.5),
      );
      ctx.ambience.setNight(night);
      ctx.ambience.setRainVisible(raining);
      return L;
    },
  };
}

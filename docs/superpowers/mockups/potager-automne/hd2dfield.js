
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { HorizontalTiltShiftShader } from "three/addons/shaders/HorizontalTiltShiftShader.js";
import { VerticalTiltShiftShader } from "three/addons/shaders/VerticalTiltShiftShader.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
import { setEnv, sprite, tile, scene as S2, SWAY, currentTod, hash } from "./pixelgen.js";

export function createField(cv, { parallax = true, items = S2.items, soil = S2.soil, wet = S2.wet, view = { y: 6.2, z: 11.5, look: [0, 0.9, -0.6] } } = {}) {
let tod = "auto", rain = false;


// ---------- HD-2D ----------
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
const LOOK = new THREE.Vector3(...view.look);

const texOf = (canvas) => {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// world: tile (tx,ty) -> x = tx - 4 + .5, z = ty - 2 + .5 ; extended border of grass
const X0 = -4, Y0 = 0, MIN_X = -5, MAX_X = 13, MIN_Y = -4, MAX_Y = 7;
const wx = (tx) => tx + X0 + 0.5;
const wz = (ty) => ty - 2 + 0.5;
const soilSet = new Set(soil.map((p) => p.join(",")));
const wetSet = new Set(wet);
const gDry = Object.assign(document.createElement("canvas"), { width: (MAX_X - MIN_X) * 48, height: (MAX_Y - MIN_Y) * 48 });
const gWet = Object.assign(document.createElement("canvas"), { width: gDry.width, height: gDry.height });
const kindAt = (tx, ty, rainy) => {
  const key = tx + "," + ty;
  return soilSet.has(key) ? (rainy || wetSet.has(key) ? "wet" : "soil") : "grass";
};
function paintTile(tx, ty) {
  const px = (tx - MIN_X) * 48, py = (ty - MIN_Y) * 48;
  gDry.getContext("2d").drawImage(tile(kindAt(tx, ty, false), tx + 40, ty + 40), px, py);
  gWet.getContext("2d").drawImage(tile(kindAt(tx, ty, true), tx + 40, ty + 40), px, py);
}
for (let ty = MIN_Y; ty < MAX_Y; ty++) for (let tx = MIN_X; tx < MAX_X; tx++) paintTile(tx, ty);
const groundDry = texOf(gDry), groundWet = texOf(gWet);
function setWet(tx, ty, on) {
  on ? wetSet.add(tx + "," + ty) : wetSet.delete(tx + "," + ty);
  paintTile(tx, ty);
  groundDry.needsUpdate = groundWet.needsUpdate = true;
}
const groundMat = new THREE.MeshStandardMaterial({ map: groundDry, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAX_X - MIN_X, MAX_Y - MIN_Y), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set((MIN_X + MAX_X) / 2 + X0, 0, (MIN_Y + MAX_Y) / 2 - 2);
ground.receiveShadow = true;
scene.add(ground);

// billboards with bottom pivot, alpha-tested shadows
const swayers = [];
function billboard(canvas, x, z, w, h, sway, phase) {
  const map = texOf(canvas);
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, 0, z);
  m.castShadow = true; m.receiveShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  scene.add(m);
  if (sway) swayers.push({ m, phase });
  return m;
}

const lanternGlows = [];
const lampLights = [];
const placed = new Map();
const byMesh = new Map();
const alphaOf = (canvas) => ({ w: canvas.width, h: canvas.height, data: canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data });

function placeItem(tx, ty, sp, c, fx = {}) {
  removeItem(tx, ty);
  const canvas = sprite(sp, c);
  const m = billboard(canvas, wx(tx), wz(ty) + 0.35, 1, 1.5, SWAY.has(sp), tx * 1.7 + ty);
  const rec = { m, sp, c, tx, ty, key: tx + "," + ty, alpha: alphaOf(canvas), type: fx.type || "item" };
  if (sp === "lanterne") {
    const gx = 21 / 32 - 0.5, gy = (48 - 30.5) / 32;
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2 / 32, 5.5 / 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.1), toneMapped: false }),
    );
    glow.position.set(gx, gy, 0.01);
    const pl = new THREE.PointLight(0xffa850, 0, 4.5, 1.6);
    pl.position.set(gx, gy, 0.25);
    m.add(glow, pl);
    lanternGlows.push(glow); lampLights.push(pl);
    lastLook = null;
  }
  if (fx.legendary) {
    const pl = new THREE.PointLight(0xffe7a0, 1.4, 2.4, 2);
    pl.position.set(0, 1.05, 0.35);
    m.add(pl);
    rec.legendary = true;
  }
  placed.set(rec.key, rec);
  byMesh.set(m, rec);
  return rec;
}
function removeItem(tx, ty) {
  const rec = placed.get(tx + "," + ty);
  if (!rec) return null;
  dispose(rec);
  placed.delete(rec.key);
  return rec;
}
function dispose(rec) {
  scene.remove(rec.m);
  byMesh.delete(rec.m);
  const si = swayers.findIndex((s) => s.m === rec.m);
  if (si >= 0) swayers.splice(si, 1);
  rec.m.children.forEach((c) => {
    const gi = lanternGlows.indexOf(c); if (gi >= 0) lanternGlows.splice(gi, 1);
    const li = lampLights.indexOf(c); if (li >= 0) lampLights.splice(li, 1);
  });
  rec.m.material.map.dispose(); rec.m.material.dispose(); rec.m.geometry.dispose();
}
let lastLook = null;
for (const [tx, ty, f] of items) placeItem(tx, ty, f.sp, f.c, f);
// ---- interaction helpers ----
const hlCanvas = document.createElement("canvas");
hlCanvas.width = hlCanvas.height = 48;
{
  const g = hlCanvas.getContext("2d");
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(3, 3, 42, 42);
  g.fillStyle = "#fff";
  for (const [x, y, dx, dy] of [[1, 1, 1, 1], [47, 1, -1, 1], [1, 47, 1, -1], [47, 47, -1, -1]]) {
    g.fillRect(dx > 0 ? x : x - 12, dy > 0 ? y : y - 3, 12, 3);
    g.fillRect(dx > 0 ? x : x - 3, dy > 0 ? y : y - 12, 3, 12);
  }
}
const hlMat = new THREE.MeshBasicMaterial({ map: texOf(hlCanvas), transparent: true, depthWrite: false, toneMapped: false });
const hl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hlMat);
hl.rotation.x = -Math.PI / 2;
hl.visible = false;
scene.add(hl);
function setHighlight(t, color = "#ffffff") {
  hl.visible = !!t;
  if (!t) return;
  hl.position.set(wx(t.tx), 0.015, wz(t.ty));
  hlMat.color.set(color).multiplyScalar(1.5);
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const crows = new Set();
function pick(clientX, clientY, { ignore } = {}) {
  const r = cv.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const g = ray.intersectObject(ground)[0];
  const base = g ? { tx: Math.floor(g.point.x - X0), ty: Math.floor(g.point.z + 2), x: g.point.x, z: g.point.z } : null;
  const meshes = [...byMesh.keys()].filter((m) => byMesh.get(m) !== ignore);
  for (const h of ray.intersectObjects(meshes, false)) {
    const rec = byMesh.get(h.object);
    if (!rec || rec.flying) continue;
    const { w, h: hh, data } = rec.alpha;
    const px = Math.min(w - 1, Math.floor(h.uv.x * w)), py = Math.min(hh - 1, Math.floor((1 - h.uv.y) * hh));
    if (data[(py * w + px) * 4 + 3] > 0) return { ...(base || {}), tx: rec.tx, ty: rec.ty, rec, soil: soilSet.has(rec.key) };
  }
  if (!base) return null;
  const key = base.tx + "," + base.ty;
  return { ...base, soil: soilSet.has(key), rec: placed.get(key) || null };
}

function lift(rec) { rec.lifted = true; rec.m.renderOrder = 2; }
function moveLifted(rec, x, z) { rec.m.position.set(x, 0.22, z + 0.35); }
function drop(rec, tx, ty) {
  rec.lifted = false;
  const key = tx + "," + ty;
  if (key !== rec.key && placed.has(key)) { rec.m.position.set(wx(rec.tx), 0, wz(rec.ty) + 0.35); return false; }
  placed.delete(rec.key);
  Object.assign(rec, { tx, ty, key });
  placed.set(key, rec);
  rec.m.position.set(wx(tx), 0, wz(ty) + 0.35);
  burst(tx, ty, "dirt");
  return true;
}

function spawnCrow(tx, ty) {
  const canvas = sprite("corbeau");
  const m = billboard(canvas, wx(tx) + 0.28, wz(ty) + 0.45, 0.8, 1.2, false, 0);
  const rec = { m, sp: "corbeau", tx, ty, key: "crow", alpha: alphaOf(canvas), type: "crow", born: performance.now() };
  byMesh.set(m, rec);
  crows.add(rec);
  return rec;
}
function chaseCrow(rec) {
  rec.flying = performance.now();
  burst(rec.tx, rec.ty, "feathers");
}

// particles
const PMAX = 600;
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, toneMapped: false, transparent: true, depthWrite: false });
const pts = new THREE.Points(pGeo, pMat);
pts.frustumCulled = false;
scene.add(pts);
const parts = [];
const KINDS = {
  water: { n: 34, cols: [[0.55, 0.8, 1.7], [0.8, 0.95, 1.8]], y: [0.9, 1.4], v: [0.3, -2.2, 0.3], g: -3, life: 0.7 },
  dirt: { n: 16, cols: [[0.35, 0.22, 0.14], [0.5, 0.34, 0.22]], y: [0.02, 0.1], v: [1.1, 1.6, 1.1], g: -6, life: 0.5 },
  leaves: { n: 30, cols: [[1.1, 0.4, 0.12], [1.2, 0.7, 0.2], [1.2, 0.9, 0.3]], y: [0.05, 0.3], v: [1.6, 2.2, 1.2], g: -3.5, life: 1.1 },
  petals: { n: 26, cols: [[1.6, 0.9, 1.2], [1.8, 1.5, 1.6], [1.4, 0.6, 0.8]], y: [0.8, 1.2], v: [1.2, 1.4, 1.0], g: -2, life: 1.0 },
  sparkle: { n: 46, cols: [[3.2, 2.6, 1.1], [3.4, 3.2, 2.2]], y: [0.7, 1.3], v: [0.9, 1.6, 0.9], g: -0.4, life: 1.4 },
  feathers: { n: 14, cols: [[0.12, 0.1, 0.18], [0.25, 0.22, 0.32]], y: [0.4, 0.7], v: [1.2, 1.2, 1.0], g: -1.2, life: 1.0 },
};
function burst(tx, ty, kind) {
  const K = KINDS[kind];
  for (let i = 0; i < K.n; i++) {
    if (parts.length >= PMAX) parts.shift();
    parts.push({
      x: wx(tx) + (Math.random() - 0.5) * 0.6, y: K.y[0] + Math.random() * (K.y[1] - K.y[0]), z: wz(ty) + 0.35 + (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * K.v[0], vy: kind === "water" ? K.v[1] * (0.6 + Math.random() * 0.4) : Math.random() * K.v[1], vz: (Math.random() - 0.5) * K.v[2],
      g: K.g, life: K.life * (0.6 + Math.random() * 0.6), age: 0, c: K.cols[i % K.cols.length],
    });
  }
}
let prevT = 0;
function updateFx(t) {
  const dt = Math.min(0.05, t - prevT); prevT = t;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += dt;
    if (p.age > p.life) { parts.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y = Math.max(0.01, p.y + p.vy * dt); p.z += p.vz * dt;
  }
  pPos.fill(0); pCol.fill(0);
  parts.forEach((p, i) => {
    const f = 1 - p.age / p.life;
    pPos.set([p.x, p.y, p.z], i * 3);
    pCol.set([p.c[0] * f, p.c[1] * f, p.c[2] * f], i * 3);
  });
  pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true;
  pGeo.setDrawRange(0, parts.length);
  hlMat.opacity = 0.65 + 0.35 * Math.sin(t * 5);
  for (const rec of placed.values()) {
    if (rec.lifted) rec.m.position.y = 0.2 + Math.sin(t * 6) * 0.04;
    if (rec.legendary && Math.random() < dt * 1.6) burst(rec.tx, rec.ty, "sparkle");
  }
  for (const c of crows) {
    if (c.flying) {
      const a = (performance.now() - c.flying) / 1000;
      c.m.position.set(wx(c.tx) + 0.28 + a * a * 4, a * 2.6 + a * a * 2, wz(c.ty) + 0.45 - a * 1.5);
      c.m.rotation.z = -0.4 * Math.min(1, a * 3);
      if (a > 1.6) { dispose(c); crows.delete(c); }
    } else {
      c.m.position.y = Math.max(0, Math.sin(t * 7 + c.born) * 0.05);
      c.m.rotation.z = Math.sin(t * 2.3 + c.born) > 0.7 ? 0.25 : 0;
    }
  }
}

const fence = sprite("cloture");
for (let tx = -2; tx < 10; tx++) billboard(fence, wx(tx), wz(-1) + 0.2, 1, 1.5, false, 0);
const tree = sprite("arbre", null, 3);
[[-3.2, -3.3], [-0.6, -3.9], [2.4, -3.4], [5.3, -3.8], [7.8, -3.2], [-6.5, -1.2], [8.9, 0.6]].forEach(([x, z], i) =>
  billboard(tree, x, z, 3, 4.5, true, i));
const bushes = [["bruyere", "heather"], ["chrysantheme", "orange"], ["aster", "white"]];
[[-4.3, 2.6], [-4.6, 0.4], [4.4, 3.4], [5.2, -1.6], [-2.8, -1.7]].forEach(([x, z], i) => {
  const [n, c] = bushes[i % 3];
  billboard(sprite(n, c), x, z, 1, 1.5, true, i * 2);
});

// sky backdrop
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 320; skyCanvas.height = 120;
const skyTex = texOf(skyCanvas);
const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 15), new THREE.MeshBasicMaterial({ map: skyTex, fog: false }));
sky.position.set(0, 5, -14);
scene.add(sky);
function paintSky(top, bottom, hill1, hill2) {
  const g = skyCanvas.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 120);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, 320, 120);
  // pixel-stepped hills
  for (const [col, base, amp, f, s] of [[hill2, 70, 14, 0.03, 1], [hill1, 84, 10, 0.05, 2]]) {
    g.fillStyle = col;
    for (let x = 0; x < 320; x++) {
      const y = Math.round(base - amp * (Math.sin(x * f + s) * 0.6 + Math.sin(x * f * 2.3 + s * 3) * 0.4));
      g.fillRect(x, y, 1, 120 - y);
    }
  }
  skyTex.needsUpdate = true;
}

// lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 0.5, far: 40 });
sun.shadow.bias = -0.0005;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog(0xffffff, 10, 30);

// falling leaves
const LEAVES = 70;
const leafGeo = new THREE.PlaneGeometry(0.07, 0.045);
const leafMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1 });
const leaves = new THREE.InstancedMesh(leafGeo, leafMat, LEAVES);
leaves.castShadow = true;
const fall = ["#b8401c", "#e08a2a", "#f2c14a", "#8f2a1a"].map((c) => new THREE.Color(c));
for (let i = 0; i < LEAVES; i++) leaves.setColorAt(i, fall[i % 4]);
scene.add(leaves);
const dummy = new THREE.Object3D();

// fireflies
const FF = 40;
const ffGeo = new THREE.BufferGeometry();
ffGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FF * 3), 3));
const ffMat = new THREE.PointsMaterial({ size: 0.05, color: new THREE.Color(3, 3.2, 1.2), toneMapped: false, transparent: true, depthWrite: false });
const fireflies = new THREE.Points(ffGeo, ffMat);
scene.add(fireflies);

// rain
const RAIN = 900;
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RAIN * 6), 3));
const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb8c8e8, transparent: true, opacity: 0.45 }));
scene.add(rainLines);

// mist sheets
const mistTex = (() => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 16;
  const g = c.getContext("2d");
  for (let x = 0; x < 64; x++) for (let y = 0; y < 16; y++) {
    const a = Math.max(0, 1 - Math.abs(y - 8) / 8) * Math.max(0, 1 - Math.abs(x - 32) / 32) * (0.6 + hash(x >> 2, y >> 2) * 0.4);
    g.fillStyle = `rgba(240,244,250,${a.toFixed(3)})`; g.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const mists = Array.from({ length: 7 }, (_, i) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.8), new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0 }));
  m.position.set(-8 + i * 3, 0.35 + (i % 3) * 0.25, -3 + i * 0.9);
  scene.add(m); return m;
});

// post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.6, 0.85);
composer.addPass(bloom);
const hts = new ShaderPass(HorizontalTiltShiftShader);
const vts = new ShaderPass(VerticalTiltShiftShader);
hts.uniforms.r.value = vts.uniforms.r.value = 0.45;
composer.addPass(hts); composer.addPass(vts);
const vig = new ShaderPass(VignetteShader);
vig.uniforms.offset.value = 1.0; vig.uniforms.darkness.value = 1.15;
composer.addPass(vig);
composer.addPass(new OutputPass());

function resize() {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const blur = 2.2;
  hts.uniforms.h.value = blur / (w * renderer.getPixelRatio());
  vts.uniforms.v.value = blur / (h * renderer.getPixelRatio());
}
new ResizeObserver(resize).observe(cv);
resize();

const LOOKS = {
  matin: { sunDir: [-6, 3, 4], sun: "#ffd2a8", sunI: 1.5, sky: "#aebcd8", gnd: "#5a5a48", hemiI: 0.9, fog: "#c9d3e2", near: 10, far: 32, bloom: 0.35, mist: 0.28, skyC: ["#9fb4d6", "#e8e0d8", "#b9c2c8", "#cfd4d8"], exp: 1.0 },
  midi: { sunDir: [-2, 9, 5], sun: "#fff3dc", sunI: 2.6, sky: "#dfe8ff", gnd: "#5c6040", hemiI: 1.0, fog: "#d6e2ec", near: 14, far: 40, bloom: 0.2, mist: 0, skyC: ["#6fa8e0", "#cfe4f2", "#7ea0a8", "#9fb9b8"], exp: 1.0 },
  soir: { sunDir: [7, 2.2, 2], sun: "#ff8a40", sunI: 2.6, sky: "#f0a080", gnd: "#402c40", hemiI: 0.65, fog: "#e39468", near: 14, far: 40, bloom: 0.55, mist: 0, skyC: ["#5a4a8a", "#ffa060", "#6a4a60", "#a0606a"], exp: 1.05 },
  nuit: { sunDir: [4, 7, 3], sun: "#8ea0e8", sunI: 0.9, sky: "#5a6aa8", gnd: "#1c1c34", hemiI: 0.9, fog: "#161c34", near: 12, far: 34, bloom: 1.0, mist: 0.1, skyC: ["#070a1c", "#1c2448", "#10142a", "#181e3a"], exp: 1.1 },
};
function applyLook() {
  const key = currentTod();
  const L = LOOKS[key];
  if (lastLook !== key + rain) {
    lastLook = key + rain;
    sun.position.set(...L.sunDir); sun.target.position.set(0, 0, 0);
    sun.color.set(L.sun); sun.intensity = L.sunI * (rain ? 0.45 : 1);
    hemi.color.set(L.sky); hemi.groundColor.set(L.gnd); hemi.intensity = L.hemiI;
    const fogC = new THREE.Color(L.fog); if (rain) fogC.lerp(new THREE.Color("#7a8494"), 0.5);
    scene.fog.color.copy(fogC); scene.fog.near = rain ? Math.min(L.near, 9) : L.near; scene.fog.far = rain ? Math.min(L.far, 30) : L.far;
    scene.background = fogC;
    bloom.strength = L.bloom;
    renderer.toneMappingExposure = L.exp;
    paintSky(...(rain ? ["#5a6474", "#9aa4b0", "#58606a", "#6c747e"] : L.skyC));
    groundMat.map = rain ? groundWet : groundDry; groundMat.needsUpdate = true;
    const night = key === "nuit";
    lampLights.forEach((l) => (l.intensity = night ? 4 : key === "soir" ? 1.2 : 0));
    lanternGlows.forEach((g) => (g.material.color.setRGB(night ? 5 : 1.4, night ? 3.2 : 1.1, night ? 1.2 : 0.5)));
    ffMat.opacity = night ? 1 : 0;
    rainLines.visible = rain;
  }
  return { L, key };
}

let mx = 0, my = 0;
window.addEventListener("pointermove", (e) => {
  if (!parallax) return;
  const r = cv.getBoundingClientRect();
  mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
});

const ffPos = ffGeo.attributes.position.array, rainPos = rainGeo.attributes.position.array;
let running = false, lastDraw = 0, frames = 0, fpsT = 0, fps = 0, raf = 0;
const FRAME_MS = 1000 / 30;
function frame(ms) {
  raf = requestAnimationFrame(frame);
  if (ms - lastDraw < FRAME_MS - 2) return;
  lastDraw = ms;
  frames++;
  if (ms - fpsT >= 1000) { fps = Math.round((frames * 1000) / (ms - fpsT)); frames = 0; fpsT = ms; }
  draw(ms);
}
function draw(ms) {
  const t = ms / 1000;
  setEnv(tod, rain);
  const { L, key } = applyLook();

  const cx = mx * (view.sway ?? 1.6) + Math.sin(t * 0.1) * 0.3;
  camera.position.set(cx + view.look[0], view.y - my * 0.8, view.z);
  camera.lookAt(LOOK);

  for (const s of swayers) s.m.rotation.z = Math.sin(t * 0.9 + s.phase) * 0.035 + (rain ? Math.sin(t * 3 + s.phase) * 0.02 : 0);

  for (let i = 0; i < LEAVES; i++) {
    const sp = 0.25 + hash(i, 3) * 0.2;
    const y = 4.5 - ((hash(i, 2) * 4.5 + t * sp) % 4.5);
    const x = -7 + ((hash(i, 1) * 14 + t * 0.25) % 14) + Math.sin(t * 1.3 + i) * 0.3;
    const z = -4 + hash(i, 4) * 8;
    dummy.position.set(x, y, z);
    dummy.rotation.set(t * 2 + i, t * 1.3 + i, Math.sin(t + i));
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;

  if (key === "nuit") {
    for (let i = 0; i < FF; i++) {
      ffPos[i * 3] = -5 + hash(i, 11) * 10 + Math.sin(t * 0.5 + i) * 0.5;
      ffPos[i * 3 + 1] = 0.3 + hash(i, 12) * 1.2 + Math.sin(t * 0.9 + i * 2) * 0.2;
      ffPos[i * 3 + 2] = -3 + hash(i, 13) * 6 + Math.cos(t * 0.4 + i) * 0.5;
    }
    ffGeo.attributes.position.needsUpdate = true;
    ffMat.size = 0.04 + Math.abs(Math.sin(t * 2)) * 0.03;
  }

  if (rain) {
    for (let i = 0; i < RAIN; i++) {
      const x = -8 + hash(i, 21) * 16, z = -5 + hash(i, 22) * 11;
      const y = 6 - ((hash(i, 23) * 6 + t * 7) % 6);
      rainPos.set([x, y, z, x - 0.03, y - 0.28, z], i * 6);
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  mists.forEach((m, i) => {
    m.material.opacity = L.mist * (0.5 + 0.5 * Math.sin(t * 0.2 + i));
    m.position.x = ((-10 + i * 3 + t * 0.15 * (1 + (i % 3) * 0.3)) % 20 + 20) % 20 - 10;
    m.lookAt(camera.position);
  });

  updateFx(t);
  composer.render();
}


return {
  start() { if (running) return; running = true; frames = 0; fpsT = performance.now(); raf = requestAnimationFrame(frame); },
  stop() { running = false; cancelAnimationFrame(raf); fps = 0; },
  get running() { return running; },
  get fps() { return running ? fps : 0; },
  setTod(v) { tod = v; },
  setRain(v) { rain = v; },
  snapshot() { draw(performance.now()); return cv.toDataURL("image/jpeg", 0.8); },
  pick, setHighlight, placeItem, removeItem, getItem: (tx, ty) => placed.get(tx + "," + ty) || null,
  items: () => [...placed.values()], lift, moveLifted, drop, burst, setWet,
  isSoil: (tx, ty) => soilSet.has(tx + "," + ty), spawnCrow, chaseCrow, crows: () => [...crows],
};
}

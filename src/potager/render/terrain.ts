import * as THREE from "three";
import { MAP, type Rect } from "../core/catalog/map";
import { PPU } from "../textures/pixel";
import { cliffFace, grassTop, pathTex, shimmerTex, stoneTex } from "../textures/terrain";
import { lambert } from "./sprite";

const px = (u: number) => Math.round(u * PPU);

function block(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  stone: boolean,
  seed: number,
) {
  const w = x1 - x0,
    h = y1 - y0,
    d = z1 - z0;
  const side = (a: number, b: number, s: number) =>
    stone ? stoneTex(px(a), px(b), s) : cliffFace(px(a), px(b), s);
  const top = stone ? stoneTex(px(w), px(d), seed) : grassTop(px(w), px(d), seed);
  const mats = [
    lambert(side(d, h, seed + 1)),
    lambert(side(d, h, seed + 2)),
    lambert(top),
    lambert(null, { color: "#2a1a10" }),
    lambert(side(w, h, seed + 3)),
    lambert(side(w, h, seed + 4)),
  ];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function decal(
  tex: THREE.Texture,
  r: Rect,
  y: number,
  extra: THREE.MeshLambertMaterialParameters = {},
) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0),
    lambert(tex, {
      transparent: true,
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      ...extra,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set((r.x0 + r.x1) / 2, y + 0.012, (r.z0 + r.z1) / 2);
  m.receiveShadow = true;
  return m;
}

export function buildTerrain() {
  const group = new THREE.Group();
  MAP.terraces.forEach((t, i) =>
    group.add(
      block(t.rect.x0, t.rect.x1, t.bottom, t.top, t.rect.z0, t.rect.z1, false, 11 + i * 10),
    ),
  );

  for (const s of MAP.stairs) {
    const rise = (s.to - s.from) / s.steps,
      depth = (s.zFoot - -4) / s.steps;
    for (let k = 1; k <= s.steps; k++)
      group.add(
        block(
          s.x0,
          s.x1,
          s.from,
          s.from + k * rise,
          -4,
          -4 + (s.steps + 1 - k) * depth,
          true,
          90 + k,
        ),
      );
  }

  MAP.paths.forEach((p, i) =>
    group.add(
      decal(
        pathTex(px(p.rect.x1 - p.rect.x0), px(p.rect.z1 - p.rect.z0), undefined, undefined, 60 + i),
        p.rect,
        p.y,
      ),
    ),
  );

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 40),
    new THREE.MeshLambertMaterial({ color: "#2e5a64" }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, MAP.water.y, MAP.water.zFrom + 20);
  const shimmer = shimmerTex();
  shimmer.repeat.set(20, 8);
  const ripples = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 40),
    new THREE.MeshBasicMaterial({ map: shimmer, transparent: true, depthWrite: false }),
  );
  ripples.rotation.x = -Math.PI / 2;
  ripples.position.set(0, MAP.water.y + 0.02, MAP.water.zFrom + 20);
  group.add(water, ripples);

  const wood = new THREE.MeshLambertMaterial({ color: "#7a5434" });
  const fence = (x0: number, x1: number) => {
    for (let x = x0; x <= x1; x += 1.6) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), wood);
      p.castShadow = true;
      p.position.set(x, 2.65, -4.35);
      group.add(p);
    }
    for (const y of [2.55, 2.9]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.2, 0.09, 0.08), wood);
      r.castShadow = true;
      r.position.set((x0 + x1) / 2, y, -4.35);
      group.add(r);
    }
  };
  fence(-30, -11.6);
  fence(-8.6, 30);

  return { group, shimmer };
}

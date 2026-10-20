import * as THREE from "three";
import {
  groundHeight,
  MAP,
  type BuildingSlot,
  type Rect,
  type TreeSpot,
} from "../core/catalog/map";
import type { PotagerSave } from "../core/types";
import { avatarViews } from "../textures/avatar";
import { cabaneTextures, etalTextures, signTex } from "../textures/buildings";
import { bushTex, glowTex, treeTex, tuftTex } from "../textures/nature";
import { abriTex, puitsTex } from "../textures/props";
import { createRng, PPU, canvasTex, dot } from "../textures/pixel";
import { PATH_GHOST, pathTex, soilTex, stoneTex } from "../textures/terrain";
import { decal } from "./terrain";
import { lambert, spriteMesh } from "./sprite";

export interface Lantern {
  light: THREE.PointLight;
  glow: THREE.Sprite;
}

interface BuildingLook {
  textures: { front: THREE.Texture; side: THREE.Texture; roof: THREE.Texture; gable: string };
  h: number;
  rise: number;
  sign: string;
  chimney: boolean;
}

const LOOKS: Partial<Record<BuildingSlot["id"], () => BuildingLook>> = {
  etal: () => ({ textures: etalTextures(), h: 2.4, rise: 1.3, sign: "Fleurs", chimney: true }),
  cabane: () => ({ textures: cabaneTextures(), h: 2, rise: 1.1, sign: "Graines", chimney: false }),
};

function building(
  slot: BuildingSlot,
  look: BuildingLook,
): { group: THREE.Group; lantern: Lantern } {
  const { w, d } = slot;
  const { textures: t, h, rise } = look;
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    lambert(t.side),
    lambert(t.side),
    lambert(null, { color: "#6a4426" }),
    lambert(null),
    lambert(t.front),
    lambert(t.side),
  ]);
  walls.position.y = h / 2;
  walls.castShadow = walls.receiveShadow = true;
  g.add(walls);

  const half = d / 2 + 0.25,
    slope = Math.hypot(half, rise),
    ang = Math.atan2(rise, half);
  for (const s of [1, -1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.12, slope), lambert(t.roof));
    r.position.set(0, h + rise / 2, (s * half) / 2);
    r.rotation.x = s * ang;
    r.castShadow = r.receiveShadow = true;
    g.add(r);
  }
  const gable = new THREE.Shape();
  gable.moveTo(-d / 2, 0);
  gable.lineTo(d / 2, 0);
  gable.lineTo(0, rise);
  gable.closePath();
  for (const s of [-1, 1]) {
    const gm = new THREE.Mesh(
      new THREE.ShapeGeometry(gable),
      new THREE.MeshLambertMaterial({ color: t.gable, side: THREE.DoubleSide }),
    );
    gm.rotation.y = Math.PI / 2;
    gm.position.set((s * w) / 2, h, 0);
    g.add(gm);
  }
  if (look.chimney) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), lambert(stoneTex(8, 22, 7)));
    c.position.set(-w / 4, h + 1.1, -0.4);
    c.castShadow = true;
    g.add(c);
  }
  const sign = signTex(look.sign);
  const img = sign.image as HTMLCanvasElement;
  const sw = img.width / 12;
  const signMesh = spriteMesh(sign, sw, (sw * img.height) / img.width);
  signMesh.position.set(-w / 4, h * 0.72, d / 2 + 0.15);
  g.add(signMesh);

  const light = new THREE.PointLight("#ffb860", 0, 4, 1.6);
  light.position.set(w / 2 - 0.1, h * 0.75, d / 2 + 0.6);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.7,
    }),
  );
  glow.scale.set(0.55, 0.55, 1);
  glow.position.copy(light.position);
  glow.visible = false;
  g.add(light, glow);

  g.position.set(slot.x, slot.y, slot.z);
  return { group: g, lantern: { light, glow } };
}

const wood = () => new THREE.MeshLambertMaterial({ color: "#7a5434" });

function ownedParcel(r: Rect, y: number, seed: number) {
  const g = new THREE.Group();
  const w = r.x1 - r.x0,
    d = r.z1 - r.z0;
  const dark = lambert(null, { color: "#4a2c18" });
  const soil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), [
    dark,
    dark,
    lambert(soilTex(Math.round(w * PPU), Math.round(d * PPU), seed)),
    dark,
    dark,
    dark,
  ]);
  soil.position.set((r.x0 + r.x1) / 2, y + 0.08, (r.z0 + r.z1) / 2);
  soil.receiveShadow = true;
  g.add(soil);
  const mat = wood();
  for (const z of [r.z0 - 0.06, r.z1 + 0.06]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.22, 0.12), mat);
    p.position.set((r.x0 + r.x1) / 2, y + 0.11, z);
    p.castShadow = true;
    g.add(p);
  }
  for (const x of [r.x0 - 0.06, r.x1 + 0.06]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, d + 0.24), mat);
    p.position.set(x, y + 0.11, (r.z0 + r.z1) / 2);
    p.castShadow = true;
    g.add(p);
  }
  return g;
}

// Bâtiments et parcelles : ce qui dépend de la sauvegarde.
export function buildPlaced(save: PotagerSave): { group: THREE.Group; lanterns: Lantern[] } {
  const group = new THREE.Group();
  const lanterns: Lantern[] = [];
  for (const slot of MAP.buildings) {
    const look = LOOKS[slot.id];
    if (!look || !save.buildings.includes(slot.id)) continue;
    const b = building(slot, look());
    group.add(b.group);
    lanterns.push(b.lantern);
  }
  MAP.parcels.forEach((p, i) => {
    const owned = save.parcels.includes(p.id);
    if (owned) group.add(ownedParcel(p.rect, p.y, 300 + i));
    else {
      const w = p.rect.x1 - p.rect.x0,
        d = p.rect.z1 - p.rect.z0;
      group.add(
        decal(
          pathTex(Math.round(w * PPU), Math.round(d * PPU), PATH_GHOST, "#7a6040", 400 + i),
          p.rect,
          p.y,
          { opacity: 0.75 },
        ),
      );
    }
  });
  return { group, lanterns };
}

const BUSHES: [number, number, number][] = [
  [-13, -3.4, 2],
  [-8, -3.3, 2],
  [8.5, -3.2, 2],
  [12.5, -3.4, 0],
  [-12.5, 3.8, 2],
  [10.5, 4, 2],
  [-1.6, -3.3, 2],
  [19, -3.3, 2],
  [-24, -3.2, 0],
  [22, 3.9, 2],
];

const near = (r: Rect, x: number, z: number, m: number) =>
  x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
const slotRect = (b: BuildingSlot): Rect => ({
  x0: b.x - b.w / 2,
  x1: b.x + b.w / 2,
  z0: b.z - b.d / 2,
  z1: b.z + b.d / 2,
});

function blocked(x: number, z: number) {
  return (
    MAP.parcels.some((p) => near(p.rect, x, z, 0.4)) ||
    MAP.buildings.some((b) => near(slotRect(b), x, z, 0.6)) ||
    MAP.paths.some((p) => near(p.rect, x, z, 0.1)) ||
    MAP.stairs.some((s) => near({ x0: s.x0, x1: s.x1, z0: -4, z1: s.zFoot }, x, z, 0.3)) ||
    Math.abs(z - -4) < 0.3 ||
    near(
      {
        x0: MAP.abri.x - MAP.abri.w / 2,
        x1: MAP.abri.x + MAP.abri.w / 2,
        z0: MAP.abri.z - MAP.abri.d / 2,
        z1: MAP.abri.z + MAP.abri.d / 2,
      },
      x,
      z,
      0.4,
    ) ||
    Math.hypot(x - MAP.puits.x, z - MAP.puits.z) < MAP.puits.r + 0.4
  );
}

// Décor fixe : arbres, buissons, touffes, tonneaux et caisses de l'étal.
export function buildDecor(): {
  group: THREE.Group;
  trees: { spot: TreeSpot; mesh: THREE.Mesh }[];
  // abri et puits : cliquables
  props: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const treeTexs = [0, 1, 2, 3].map(treeTex);
  const trees = MAP.trees.map((spot) => {
    const mesh = spriteMesh(treeTexs[spot.palette], spot.size * 0.75, spot.size);
    // seuil bas : l'arbre reste visible quand il s'estompe devant l'avatar
    (mesh.material as THREE.MeshLambertMaterial).alphaTest = 0.1;
    mesh.position.set(spot.x, spot.y, spot.z);
    group.add(mesh);
    return { spot, mesh };
  });
  const abri = spriteMesh(abriTex(), 2.2, 2.08);
  abri.position.set(
    MAP.abri.x,
    groundHeight(MAP.abri.x, MAP.abri.z),
    MAP.abri.z + MAP.abri.d / 2 - 0.2,
  );
  const puits = spriteMesh(puitsTex(), 1.7, 2.06);
  puits.position.set(MAP.puits.x, groundHeight(MAP.puits.x, MAP.puits.z), MAP.puits.z + 0.2);
  group.add(abri, puits);
  const bushTexs = [0, 2].map(bushTex);
  for (const [x, z, p] of BUSHES) {
    const m = spriteMesh(bushTexs[p === 0 ? 0 : 1], 2, 1.25);
    m.position.set(x, groundHeight(x, z), z);
    group.add(m);
  }
  const rng = createRng(77);
  const tufts = [tuftTex(false), tuftTex(true)];
  const tuftMats = tufts.map(
    (t) => new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }),
  );
  const tuftGeo = new THREE.PlaneGeometry(0.5, 0.5).translate(0, 0.25, 0);
  let placed = 0;
  for (let i = 0; i < 2000 && placed < 520; i++) {
    const x = MAP.bounds.x0 - 6 + rng() * (MAP.bounds.x1 - MAP.bounds.x0 + 12);
    const z = -14 + rng() * 18.4;
    if (blocked(x, z)) continue;
    const m = new THREE.Mesh(tuftGeo, tuftMats[rng() < 0.75 ? 0 : 1]);
    m.position.set(x, groundHeight(x, z), z);
    m.receiveShadow = true;
    group.add(m);
    placed++;
  }

  const barrelTex = canvasTex(32, 16, (g, r) => {
    for (let x = 0; x < 32; x++)
      dot(
        g,
        x,
        0,
        x % 4 === 0 ? "#5a3820" : ["#9a6a3a", "#a87444", "#8c5e32"][Math.floor(r() * 3)],
        1,
        16,
      );
    dot(g, 0, 3, "#4a4a50", 32, 1);
    dot(g, 0, 12, "#4a4a50", 32, 1);
  });
  for (const p of MAP.barrels) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.85, 14), [
      lambert(barrelTex),
      lambert(null, { color: "#7a5030" }),
      lambert(null),
    ]);
    b.castShadow = b.receiveShadow = true;
    b.position.set(p.x, 0.42, p.z);
    group.add(b);
  }
  return { group, trees, props: [abri, puits] };
}

export function buildAvatar() {
  const { views, textures } = avatarViews();
  const mesh = spriteMesh(views.down.idle, 1.2, 1.8);
  mesh.position.set(MAP.spawn.x, groundHeight(MAP.spawn.x, MAP.spawn.z), MAP.spawn.z);
  return { mesh, views, textures };
}

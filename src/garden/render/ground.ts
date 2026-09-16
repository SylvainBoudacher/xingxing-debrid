import * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { groundTile } from "../sprites/ground";
import { SPRITE_TILE } from "../sprites/sprite";
import { pixelTexture } from "./texture";
import { WORLD } from "./world";

export interface Ground {
  setSoil(keys: TileKey[]): void;
  setWet(keys: Set<TileKey>): void;
  setDry(keys: Set<TileKey>): void;
  setRaining(on: boolean): void;
  dispose(): void;
}

const T = SPRITE_TILE;

// Deux versions du sol : sèche (cases arrosées foncées) et sous la pluie (toute la terre mouillée).
export function createGround(scene: THREE.Scene): Ground {
  const cols = WORLD.MAX_X - WORLD.MIN_X;
  const rows = WORLD.MAX_Y - WORLD.MIN_Y;
  const dry = Object.assign(document.createElement("canvas"), {
    width: cols * T,
    height: rows * T,
  });
  const rainy = Object.assign(document.createElement("canvas"), {
    width: cols * T,
    height: rows * T,
  });
  let soil = new Set<TileKey>();
  let wet = new Set<TileKey>();
  let parched = new Set<TileKey>();

  function paint(tx: number, ty: number) {
    const key = `${tx},${ty}` as TileKey;
    const px = (tx - WORLD.MIN_X) * T;
    const py = (ty - WORLD.MIN_Y) * T;
    const isSoil = soil.has(key);
    const kind = !isSoil ? "grass" : wet.has(key) ? "wet" : parched.has(key) ? "dry" : "soil";
    dry.getContext("2d")!.drawImage(groundTile(kind, tx, ty), px, py);
    rainy.getContext("2d")!.drawImage(groundTile(isSoil ? "wet" : "grass", tx, ty), px, py);
  }
  for (let ty = WORLD.MIN_Y; ty < WORLD.MAX_Y; ty++)
    for (let tx = WORLD.MIN_X; tx < WORLD.MAX_X; tx++) paint(tx, ty);

  const dryTex = pixelTexture(dry);
  const rainyTex = pixelTexture(rainy);
  const material = new THREE.MeshStandardMaterial({ map: dryTex, roughness: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cols, rows), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(
    (WORLD.MIN_X + WORLD.MAX_X) / 2 + WORLD.X0,
    0,
    (WORLD.MIN_Y + WORLD.MAX_Y) / 2 - 2,
  );
  mesh.receiveShadow = true;
  scene.add(mesh);

  function repaint(keys: Iterable<TileKey>) {
    let changed = false;
    for (const key of keys) {
      const [tx, ty] = parseTileKey(key);
      paint(tx, ty);
      changed = true;
    }
    if (changed) dryTex.needsUpdate = rainyTex.needsUpdate = true;
  }

  const symmetricDiff = (a: Set<TileKey>, b: Set<TileKey>) => [
    ...[...a].filter((k) => !b.has(k)),
    ...[...b].filter((k) => !a.has(k)),
  ];

  return {
    setSoil(keys) {
      const next = new Set(keys);
      const changed = symmetricDiff(soil, next);
      soil = next;
      repaint(changed);
    },
    setWet(keys) {
      const changed = symmetricDiff(wet, keys);
      wet = new Set(keys);
      repaint(changed);
    },
    setDry(keys) {
      const changed = symmetricDiff(parched, keys);
      parched = new Set(keys);
      repaint(changed);
    },
    setRaining(on) {
      const map = on ? rainyTex : dryTex;
      if (material.map !== map) {
        material.map = map;
        material.needsUpdate = true;
      }
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      dryTex.dispose();
      rainyTex.dispose();
    },
  };
}

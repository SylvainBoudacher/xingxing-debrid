import * as THREE from "three";
import { groundHeight } from "../core/catalog/map";
import { COLOR_HEX } from "../textures/flowerShapes";
import { RARITY_COLOR } from "../core/catalog/rarity";
import { staffSpeed } from "../core/staff/grade";
import { STAFF_IDS, type Point, type PotagerSave, type StaffId, type Worker } from "../core/types";
import { avatarViews, STAFF_PALETTES } from "../textures/avatar";
import { canIconTex, flowerIconTex, pouchIconTex } from "../textures/staffIcons";
import { spriteMesh } from "./sprite";

const STEP_FRAME_S = 0.075;
// la simulation avance par pas d'une seconde : l'affichage rattrape un peu plus vite
const CATCH_UP = 1.3;
// au-delà, l'employé est replacé d'un coup (chargement, grand pas)
const SNAP = 6;
const ICON_Y = 2.05;

interface Shown {
  mesh: THREE.Mesh;
  icon: THREE.Sprite;
  iconKey: string;
  pos: Point;
  dir: Point;
  walkT: number;
  worker: Worker;
  speed: number;
}

// Les employés embauchés : ils suivent les positions de la simulation, en jeu comme en fond passif.
export function createStaff(scene: THREE.Scene) {
  const sets = Object.fromEntries(
    STAFF_IDS.map((id) => [id, avatarViews(STAFF_PALETTES[id])]),
  ) as Record<StaffId, ReturnType<typeof avatarViews>>;
  const icons = new Map<string, THREE.Texture>();
  const shown = new Map<StaffId, Shown>();

  const iconTex = (key: string, make: () => THREE.Texture) => {
    if (!icons.has(key)) icons.set(key, make());
    return icons.get(key)!;
  };

  // ce que l'employé tient : l'arrosoir de l'arroseur, des graines, des fleurs
  function iconFor(id: StaffId, w: Worker): { key: string; tex: THREE.Texture | null } {
    const f = w.carry.flowers[0];
    if (f)
      return {
        key: `f${f.color}`,
        tex: iconTex(`f${f.color}`, () => flowerIconTex(COLOR_HEX[f.color][0])),
      };
    const s = w.carry.seeds[0];
    if (s)
      return {
        key: `s${s.rarity}`,
        tex: iconTex(`s${s.rarity}`, () => pouchIconTex(RARITY_COLOR[s.rarity])),
      };
    if (id === "arroseur") return { key: "can", tex: iconTex("can", canIconTex) };
    return { key: "", tex: null };
  }

  function add(id: StaffId, w: Worker): Shown {
    const mesh = spriteMesh(sets[id].views.down.idle, 1.2, 1.8);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false }));
    icon.scale.set(0.42, 0.42, 1);
    icon.visible = false;
    scene.add(mesh, icon);
    return {
      mesh,
      icon,
      iconKey: "",
      pos: w.pos,
      dir: { x: 0, z: 1 },
      walkT: 0,
      worker: w,
      speed: 1,
    };
  }

  return {
    sync(save: PotagerSave) {
      for (const id of STAFF_IDS) {
        const w = save.crew[id];
        const h = save.staff[id];
        if (!w || !h) continue;
        const s = shown.get(id) ?? add(id, w);
        shown.set(id, s);
        s.worker = w;
        s.speed = staffSpeed(h.level) * CATCH_UP;
        const { key, tex } = iconFor(id, w);
        if (key !== s.iconKey) {
          s.iconKey = key;
          (s.icon.material as THREE.SpriteMaterial).map = tex;
          (s.icon.material as THREE.SpriteMaterial).needsUpdate = true;
          s.icon.visible = !!tex;
        }
      }
    },
    update(dt: number) {
      for (const [id, s] of shown) {
        const to = s.worker.pos;
        const d = Math.hypot(to.x - s.pos.x, to.z - s.pos.z);
        let moving = false;
        if (d > SNAP) s.pos = to;
        else if (d > 0.02) {
          const step = Math.min(d, s.speed * dt);
          s.dir = { x: (to.x - s.pos.x) / d, z: (to.z - s.pos.z) / d };
          s.pos = { x: s.pos.x + s.dir.x * step, z: s.pos.z + s.dir.z * step };
          moving = true;
        }
        s.walkT = moving ? s.walkT + dt : 0;
        const { views } = sets[id];
        const vertical = Math.abs(s.dir.z) > Math.abs(s.dir.x);
        const view = views[vertical ? (s.dir.z < 0 ? "up" : "down") : "side"];
        // en plein geste : tourné vers sa case, petit balancement
        const working = !moving && s.worker.doneAt !== null;
        const map = moving
          ? view.walk[Math.floor(s.walkT / STEP_FRAME_S) % view.walk.length]
          : working
            ? views.up.idle
            : views.down.idle;
        const mat = s.mesh.material as THREE.MeshLambertMaterial;
        if (mat.map !== map) mat.map = map;
        s.mesh.scale.x = moving && !vertical ? Math.sign(s.dir.x) : 1;
        const y = groundHeight(s.pos.x, s.pos.z);
        s.mesh.position.set(
          s.pos.x,
          y + (working ? Math.abs(Math.sin(performance.now() / 160)) * 0.05 : 0),
          s.pos.z,
        );
        s.icon.position.set(s.pos.x, y + ICON_Y, s.pos.z);
      }
    },
    dispose() {
      for (const s of shown.values()) {
        scene.remove(s.mesh, s.icon);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        (s.icon.material as THREE.Material).dispose();
      }
      Object.values(sets).forEach((set) => set.textures.forEach((t) => t.dispose()));
      icons.forEach((t) => t.dispose());
    },
  };
}

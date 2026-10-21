import type * as THREE from "three";
import { canvasTex, dot, outlineCanvas } from "./pixel";

export const PEST_PAL: Record<string, string> = {
  g: "#6a8a2a",
  G: "#4a6a1e",
  y: "#c8b040",
  k: "#1e1a22",
  K: "#3a3444",
  w: "#5a5266",
  e: "#e8d8a0",
  b: "#d89a3a",
  m: "#c84a3a",
  M: "#8e2a22",
  s: "#efe4cc",
  a: "#8a5a2a",
  A: "#5a3a1a",
  c: "#a8763a",
  t: "#e05ac0",
  T: "#9a2a88",
};

function sprite(rows: string[]): THREE.Texture {
  const w = rows[0].length,
    h = rows.length;
  return canvasTex(w, h, (g) => {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => PEST_PAL[ch] && dot(g, x, y, PEST_PAL[ch])),
    );
    outlineCanvas(g, w, h);
  });
}

const cache = new Map<string, THREE.Texture>();
const cached = (key: string, rows: () => string[]) => {
  let t = cache.get(key);
  if (!t) cache.set(key, (t = sprite(rows())));
  return t;
};

// chardon hirsute aux têtes violettes, pour trancher sur la verdure
export const WEED_ROWS = [
  "..tt....tt....",
  ".tTt...tTt.tt.",
  "..g.....g.tTt.",
  "..g..g..g..g..",
  ".gG.gG.gGg.g..",
  ".gG.gGgG.Gg.g.",
  "gGG.GGgG.GGgG.",
  "gGGgGGGGgGGGG.",
  ".GGGGGGGGGGGG.",
  "..GGGGGGGGGG..",
];
export const weedTex = () => cached("weed", () => WEED_ROWS);

// enchevêtrement posé à plat qui couvre la case envahie
export const weedPatchTex = () =>
  cached("weedPatch", () => {
    const rows: string[] = [];
    for (let y = 0; y < 16; y++) {
      let row = "";
      for (let x = 0; x < 16; x++) {
        const edge = Math.min(x, y, 15 - x, 15 - y);
        const h = (x * 7 + y * 13 + x * y) % 11;
        row += edge === 0 && h % 2 ? "." : h === 0 ? "t" : h < 4 ? "G" : h < 6 ? "A" : ".";
      }
      rows.push(row);
    }
    return rows;
  });

const CROW_BODY = [
  "......kk....",
  ".....kKkb...",
  ".....kekbb..",
  "...kkkkk....",
  "..kKKKKKk...",
  ".kKwwKKKk...",
  "kKwwKKKkk...",
];

// corneille posée, ailes repliées (0) ou entrouvertes (1)
export const crowTex = (frame: 0 | 1) =>
  cached(`crow${frame}`, () =>
    frame === 0
      ? [...CROW_BODY, "..kkkkk.....", "...b..b.....", "............"]
      : [
          ...CROW_BODY.slice(0, 4),
          "kKKKKKKKk...",
          "KwwwKKKkkk..",
          "kwwKKKkk..k.",
          "..kkkkk.....",
          "...b..b.....",
          "............",
        ],
  );

export const mushroomTex = () =>
  cached("mushroom", () => [
    "...mmmm...",
    "..mMsmMm..",
    ".mmsmmMsm.",
    "mMmmmsmmMm",
    "MMMMMMMMMM",
    "....ss....",
    "....ss....",
    "...ssss...",
  ]);

export const acornTex = () =>
  cached("acorn", () => [
    "....A...",
    "..AaaA..",
    ".AaAaAA.",
    ".cccccc.",
    ".cbcccc.",
    ".cbcccc.",
    "..cccc..",
    "...cc...",
  ]);

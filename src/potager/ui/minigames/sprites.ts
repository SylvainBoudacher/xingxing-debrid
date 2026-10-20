import { PEST_PAL, WEED_ROWS } from "../../textures/pests";
import { makeSprite, type Pal } from "./pixelKit";

const TOOL: Pal = {
  w: "#8a5a2a",
  v: "#b07a3a",
  W: "#5e3a1a",
  m: "#9aa4b0",
  M: "#5e6874",
  n: "#d8e0e8",
};

// bêche, poignée en haut
export const SPADE = makeSprite(
  [
    "..wvvw..",
    ".w....w.",
    ".w....w.",
    "..wvvw..",
    "...vw...",
    "...vw...",
    "...vw...",
    "...vw...",
    "...vw...",
    "...vw...",
    "...vw...",
    "..MmmM..",
    ".MnmmmM.",
    ".MnmmmM.",
    ".MnmmmM.",
    ".MnmmmM.",
    ".MmmmmM.",
    "..MmmM..",
  ],
  TOOL,
);

// arrosoir, bec vers la droite ; pomme en (16, 2)
export const CAN = makeSprite(
  [
    "...MMMMM..........",
    "..M.....M.........",
    "..M.....M.......n.",
    ".mmmmmmmmmm....nm.",
    ".mnnnnnnnmmM..nm..",
    ".mnmmmmmmmmMMnm...",
    ".mnmmmmmmmmMmm....",
    ".mnmmmmmmmmM......",
    ".mmmmmmmmmmM......",
    ".MMMMMMMMMMM......",
  ],
  { m: "#5a9a7a", M: "#3a6a54", n: "#9ad0b0" },
);
export const CAN_SPOUT = { x: 16, y: 2 };

export const SEED = makeSprite(
  [
    "..hh...",
    ".hhss..",
    "hhssss.",
    "hsssssS",
    "ssssssS",
    "sssssSS",
    ".sssSS.",
    "..sSS..",
    "...S...",
  ],
  { h: "#f4dca0", s: "#d8a85a", S: "#9a6a30" },
);

export const SPROUT = makeSprite([".ll.ll.", "lllglll", ".lggGl.", "...G...", "...G..."], {
  l: "#9cc75a",
  g: "#5f9a3a",
  G: "#3e6b2f",
});

export const DROP = makeSprite(["..q..", "..a..", ".aqa.", "aqaaa", "aaaaA", ".aaA."], {
  q: "#a8d4ff",
  a: "#4a8ad8",
  A: "#2a5a9a",
});

export const WEED = makeSprite(WEED_ROWS, PEST_PAL);

// nœud du ruban
export const BOW = makeSprite(
  ["pr.....rp", "rpr...rpr", "rrrrRrrrr", "rpr.R.rpr", "pr.RrR.rp", "...R.R...", "..R...R.."],
  { r: "#d8405a", R: "#8e2440", p: "#f490a8" },
);

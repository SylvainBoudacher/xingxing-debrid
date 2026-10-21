import type { StaffId } from "../core/types";
import * as THREE from "three";
import {
  BACK_HEAD,
  FAR,
  FRONT_ARMS,
  FRONT_HEAD,
  FRONT_RUN,
  FRONT_RUN_ARMS,
  FRONT_STAND,
  FRONT_TORSO,
  HIP_Y,
  mirror,
  NEAR,
  PAL,
  SHOULDER_Y,
  type Swap,
} from "./avatarArt";
import {
  SIDE_ARM_CYCLE,
  SIDE_ARMS,
  SIDE_DY,
  SIDE_HEAD,
  SIDE_LEG,
  SIDE_STAND,
  SIDE_TORSO,
} from "./avatarArtSide";
import { canvasTex, dot } from "./pixel";

interface Layer {
  rows: string[];
  y: number;
  x?: number;
  swap?: Swap;
}

// couches peintes dans l'ordre : chaque pixel non vide recouvre les précédents
const composer = (palette: Record<string, string>) => (layers: Layer[]) =>
  canvasTex(16, 24, (g) => {
    for (const { rows, y, x = 0, swap = NEAR } of layers)
      rows.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          const c = palette[swap[ch] ?? ch];
          if (c) dot(g, x + i, y + j, c);
        }),
      );
  });
type Compose = ReturnType<typeof composer>;

// tenues des clients : cheveux, bandeau, tunique et pantalon changent
export const CLIENT_PALETTES: Record<string, string>[] = [
  {
    ...PAL,
    h: "#4a3020",
    H: "#2e1c12",
    r: "#e8dcc0",
    b: "#7a9a3a",
    B: "#58742a",
    p: "#3a4a6a",
    P: "#28344c",
  },
  {
    ...PAL,
    h: "#c8402e",
    H: "#8a2a1c",
    r: "#2e5a8a",
    b: "#b84a8a",
    B: "#843464",
    p: "#6a6a70",
    P: "#4a4a50",
  },
  {
    ...PAL,
    h: "#d8d8dc",
    H: "#9a9aa2",
    r: "#7a4a24",
    b: "#d8a040",
    B: "#a47a2c",
    p: "#4a2c18",
    P: "#321e10",
  },
  {
    ...PAL,
    h: "#222228",
    H: "#101014",
    r: "#c8402e",
    b: "#6a4a9a",
    B: "#4a3270",
    p: "#8a7a5a",
    P: "#665a40",
  },
];

// une tenue par métier, distincte de l'avatar et des clients
export const STAFF_PALETTES: Record<StaffId, Record<string, string>> = {
  arroseur: {
    ...PAL,
    h: "#6a4a2a",
    H: "#4a321c",
    r: "#3a7ac8",
    b: "#3a6aa8",
    B: "#284c7c",
    p: "#5a4a3a",
    P: "#403428",
  },
  jardinier: {
    ...PAL,
    h: "#2e2018",
    H: "#1a120c",
    r: "#e8c050",
    b: "#5a8a3a",
    B: "#406628",
    p: "#7a5a3a",
    P: "#58402a",
  },
  cueilleur: {
    ...PAL,
    h: "#d89a4a",
    H: "#a8702e",
    r: "#e8dcc0",
    b: "#c86a8a",
    B: "#9a4a66",
    p: "#4a4a5a",
    P: "#343440",
  },
  fleuriste: {
    ...PAL,
    h: "#8a2a2a",
    H: "#5e1a1a",
    r: "#f2ecd8",
    b: "#3a8a6a",
    B: "#28644c",
    p: "#e6d8b8",
    P: "#b8a888",
  },
};

const pad = (rows: string[]) => rows.map((r) => r.padEnd(16, "."));

type FrontArm = keyof typeof FRONT_ARMS;
// de dos, le bras qui part en arrière vient vers la caméra
const BACK_SWAP: Record<FrontArm, FrontArm> = {
  mid: "mid",
  fwd1: "back1",
  fwd2: "back2",
  back1: "fwd1",
  back2: "fwd2",
};

function frontFrame(
  compose: Compose,
  head: string[],
  legs: string[],
  dy: number,
  arms: [FrontArm, FrontArm],
  back: boolean,
) {
  const [l, r] = back ? arms.map((a) => BACK_SWAP[a]) : arms;
  return compose([
    { rows: legs, y: HIP_Y + dy },
    { rows: FRONT_TORSO, y: SHOULDER_Y + dy },
    { rows: head, y: dy },
    { rows: FRONT_ARMS[l], y: SHOULDER_Y + dy },
    { rows: mirror(pad(FRONT_ARMS[r])), y: SHOULDER_Y + dy },
  ]);
}

function frontView(compose: Compose, back: boolean) {
  const head = back ? BACK_HEAD : FRONT_HEAD;
  const idle = frontFrame(compose, head, FRONT_STAND, 0, ["mid", "mid"], back);
  const run = [false, true].flatMap((flip) =>
    FRONT_RUN.map(({ dy, legs }, i) => {
      const [l, r] = FRONT_RUN_ARMS[i];
      return flip
        ? frontFrame(compose, head, mirror(legs), dy, [r, l], back)
        : frontFrame(compose, head, legs, dy, [l, r], back);
    }),
  );
  return { idle, walk: run };
}

function sideView(compose: Compose) {
  const idle = compose([
    { rows: SIDE_STAND, y: HIP_Y },
    { rows: SIDE_TORSO, y: SHOULDER_Y },
    { rows: SIDE_HEAD, y: 0 },
    { rows: SIDE_ARMS.mid, y: SHOULDER_Y },
  ]);
  const run = SIDE_DY.map((dy, i) => {
    const far = (i + 4) % 8;
    // en course le buste se penche : tête un pixel en avant
    return compose([
      { rows: SIDE_ARMS[SIDE_ARM_CYCLE[far]], y: SHOULDER_Y + dy, swap: FAR },
      { rows: SIDE_LEG[far], y: HIP_Y + dy, swap: FAR },
      { rows: SIDE_TORSO, y: SHOULDER_Y + dy },
      { rows: SIDE_HEAD, y: dy, x: 1 },
      { rows: SIDE_LEG[i], y: HIP_Y + dy },
      { rows: SIDE_ARMS[SIDE_ARM_CYCLE[i]], y: SHOULDER_Y + dy },
    ]);
  });
  return { idle, walk: run };
}

export interface AvatarView {
  idle: THREE.Texture;
  // cycle de course, en boucle
  walk: THREE.Texture[];
}

export function avatarViews(palette: Record<string, string> = PAL) {
  const compose = composer(palette);
  const views = {
    down: frontView(compose, false),
    up: frontView(compose, true),
    side: sideView(compose),
  } satisfies Record<string, AvatarView>;
  const textures = Object.values(views).flatMap((v) => [v.idle, ...v.walk]);
  return { views, textures };
}

export type AvatarViews = ReturnType<typeof avatarViews>["views"];

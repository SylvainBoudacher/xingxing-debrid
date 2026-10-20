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
const compose = (layers: Layer[]) =>
  canvasTex(16, 24, (g) => {
    for (const { rows, y, x = 0, swap = NEAR } of layers)
      rows.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          const c = PAL[swap[ch] ?? ch];
          if (c) dot(g, x + i, y + j, c);
        }),
      );
  });

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

function frontView(back: boolean) {
  const head = back ? BACK_HEAD : FRONT_HEAD;
  const idle = frontFrame(head, FRONT_STAND, 0, ["mid", "mid"], back);
  const run = [false, true].flatMap((flip) =>
    FRONT_RUN.map(({ dy, legs }, i) => {
      const [l, r] = FRONT_RUN_ARMS[i];
      return flip
        ? frontFrame(head, mirror(legs), dy, [r, l], back)
        : frontFrame(head, legs, dy, [l, r], back);
    }),
  );
  return { idle, walk: run };
}

function sideView() {
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

export function avatarViews() {
  const views = {
    down: frontView(false),
    up: frontView(true),
    side: sideView(),
  } satisfies Record<string, AvatarView>;
  const textures = Object.values(views).flatMap((v) => [v.idle, ...v.walk]);
  return { views, textures };
}

export type AvatarViews = ReturnType<typeof avatarViews>["views"];

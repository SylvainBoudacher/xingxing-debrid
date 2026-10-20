// Pixel art de l'avatar, 16x24, découpé en couches pour composer les poses de course.
// Jambes : '1' tissu, '2' chaussure ; bras : '3' manche, '4' main. Recolorés proche/lointain.
export const PAL: Record<string, string> = {
  o: "#2e1c12",
  h: "#e8c060",
  H: "#b88e3a",
  r: "#c8402e",
  y: "#7a4a24",
  s: "#f4c8a0",
  S: "#d49a78",
  e: "#1e120a",
  b: "#3a6ab0",
  B: "#28487e",
  p: "#6a4a30",
  P: "#4a3020",
  k: "#3a2418",
  K: "#22140c",
};

export type Swap = Record<string, string>;
export const NEAR: Swap = { "1": "p", "2": "k", "3": "b", "4": "s" };
export const FAR: Swap = { "1": "P", "2": "K", "3": "B", "4": "S" };

export const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(""));

// rangée du haut des jambes et des épaules (corps au repos)
export const HIP_Y = 18;
export const SHOULDER_Y = 11;

// ---- face / dos ----
export const FRONT_HEAD = [
  "................",
  "......oooo......",
  ".....ohhhho.....",
  ".....ohhhho.....",
  "....orrrrrro....",
  "..oohhhhhhhhoo..",
  "..oHHHHHHHHHHo..",
  "...oyssssssyo...",
  "...oysessesyo...",
  "...oyssssssyo...",
  "....oSSSSSSo....",
];
export const BACK_HEAD = FRONT_HEAD.map((r, i) =>
  i >= 7 && i <= 9 ? "...oyyyyyyyyo..." : i === 10 ? "....oyyyyyyo...." : r,
);
export const FRONT_TORSO = [
  "....obbbbbbo....",
  "....obbbbbbo....",
  "....oBbbbbBo....",
  "....oBbbbbBo....",
  "....oBbbbbBo....",
  "....oppppppo....",
  "....oPppppPo....",
];

// bras gauche de l'écran ; le droit est son miroir
export const FRONT_ARMS = {
  mid: ["..o3", "..o3", "..o3", "..o3", "..o4", "..oo"],
  // vers la caméra : raccourci, la main passe devant le torse
  fwd1: ["..o3", "..o3", "..o3o", "..o44o", "...oo"],
  fwd2: ["..o3", "..o33o", "...o44o", "....oo"],
  // vers l'arrière : la main ressort plus bas, en dehors
  back1: ["..o3", "..o3", "..o3", "..o3", ".o4o", ".oo"],
  back2: ["..o3", "..o3", ".o3o", ".o3o", ".o4o", ".ooo"],
};

export const FRONT_STAND = [
  "....oppppppo....",
  "....oppooppo....",
  "....opo..opo....",
  "....opo..opo....",
  "...okko..okko...",
  "...oooo..oooo...",
];

// demi-cycle de course (jambe gauche de l'écran en avant) ; l'autre moitié est le miroir.
// dy : décalage du corps (1 = plus bas, -1 = suspension, pieds décollés)
export const FRONT_RUN: { dy: number; legs: string[] }[] = [
  {
    dy: 0,
    legs: [
      "....oppppppo....",
      "....oppooppo....",
      "....opo..opo....",
      "....opo..oko....",
      "...okko..ooo....",
      "...oooo.........",
    ],
  },
  {
    dy: 1,
    legs: [
      "....oppppppo....",
      "....oppooppo....",
      "...oppo..oko....",
      "...okko..ooo....",
      "...oooo.........",
    ],
  },
  {
    dy: 0,
    legs: [
      "....oppppppo....",
      "....oppooppo....",
      "....opo.oppo....",
      "....opo.okko....",
      "...okko.oooo....",
      "...oooo.........",
    ],
  },
  {
    dy: -1,
    legs: [
      "....oppppppo....",
      "....oppooppo....",
      "....oko..opo....",
      "....ooo..opo....",
      ".........okko...",
      ".........oooo...",
    ],
  },
];
// bras [gauche, droit] de l'écran pour chaque frame du demi-cycle
export const FRONT_RUN_ARMS: [keyof typeof FRONT_ARMS, keyof typeof FRONT_ARMS][] = [
  ["back2", "fwd2"],
  ["back1", "fwd1"],
  ["mid", "mid"],
  ["fwd1", "back1"],
];

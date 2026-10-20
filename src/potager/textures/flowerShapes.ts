import type { ColorId } from "../core/catalog/colors";
import type { SpeciesId } from "../core/catalog/species";

// Grilles de 16 x 24 pixels, sol en bas. Rôles :
// p / P pétale clair / foncé (couleur de la fleur), c coeur brun, y coeur jaune,
// s tige, l feuille, b bouton fermé, m motte de terre.
export const W = 16,
  H = 24;

type Grid = string[][];

const blank = (): Grid => Array.from({ length: H }, () => Array<string>(W).fill("."));
const done = (g: Grid) => g.map((r) => r.join(""));

function set(g: Grid, x: number, y: number, ch: string) {
  const xi = Math.round(x),
    yi = Math.round(y);
  if (xi >= 0 && xi < W && yi >= 0 && yi < H) g[yi][xi] = ch;
}

function stem(g: Grid, x: number, top: number, bottom = H - 1) {
  for (let y = top; y <= bottom; y++) set(g, x, y, "s");
}

function leaf(g: Grid, x: number, y: number, side: -1 | 1, len = 3) {
  for (let i = 1; i <= len; i++) {
    set(g, x + side * i, y - Math.floor(i / 2), "l");
    if (i < len) set(g, x + side * i, y - Math.floor(i / 2) + 1, "l");
  }
}

function disk(g: Grid, cx: number, cy: number, r: number, ch: string) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(g, x, y, ch);
}

// n pétales en rayons, alternés clair / foncé ; `thick` les élargit d'un pixel
function petals(
  g: Grid,
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  n: number,
  thick = false,
  phase = 0,
) {
  for (let k = 0; k < n; k++) {
    const a = phase + (k / n) * Math.PI * 2;
    const ch = k % 2 ? "P" : "p";
    for (let r = r1; r <= r2; r += 0.5) {
      set(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, ch);
      if (thick) set(g, cx + Math.cos(a + 0.18) * r, cy + Math.sin(a + 0.18) * r, ch);
    }
  }
}

function daisy(
  g: Grid,
  cx: number,
  cy: number,
  r: number,
  n: number,
  core: string,
  coreR: number,
  thick: boolean,
) {
  petals(g, cx, cy, coreR, r, n, thick);
  disk(g, cx, cy, coreR, core);
}

const SHAPES: Record<SpeciesId, () => Grid> = {
  // grand, large disque brun cerné de pétales
  tournesol: () => {
    const g = blank();
    stem(g, 8, 9);
    leaf(g, 8, 15, -1, 4);
    leaf(g, 8, 19, 1, 4);
    daisy(g, 8, 6, 6, 16, "c", 3, true);
    return g;
  },
  // épi de petites fleurs le long d'une haute tige
  rosetremiere: () => {
    const g = blank();
    stem(g, 8, 1);
    [
      [8, 2, 1.4],
      [7, 5, 2],
      [9, 8, 2.2],
      [7, 11, 2.4],
      [9, 14, 2.4],
    ].forEach(([x, y, r], i) => {
      disk(g, x, y, r, i % 2 ? "P" : "p");
      set(g, x, y, "y");
    });
    leaf(g, 8, 19, -1, 3);
    leaf(g, 8, 21, 1, 3);
    return g;
  },
  // pompon rond en cercles concentriques
  dahlia: () => {
    const g = blank();
    stem(g, 8, 13);
    leaf(g, 8, 17, -1, 4);
    leaf(g, 8, 20, 1, 4);
    disk(g, 8, 8, 5.5, "P");
    disk(g, 8, 8, 4.3, "p");
    disk(g, 8, 8, 3, "P");
    disk(g, 8, 8, 1.6, "p");
    return g;
  },
  // 8 pétales fins et espacés, tige grêle, feuillage plumeux
  cosmos: () => {
    const g = blank();
    stem(g, 8, 9);
    for (const [y, side] of [
      [14, -1],
      [17, 1],
      [20, -1],
    ] as const)
      leaf(g, 8, y, side, 4);
    petals(g, 8, 6, 1.5, 5, 8, false, Math.PI / 8);
    disk(g, 8, 6, 1.2, "y");
    return g;
  },
  // deux petites marguerites sur tiges ramifiées
  aster: () => {
    const g = blank();
    stem(g, 8, 16);
    for (let i = 0; i < 6; i++) {
      set(g, 7 - i * 0.5, 15 - i, "s");
      set(g, 9 + i * 0.4, 15 - i * 1.4, "s");
    }
    daisy(g, 4.5, 8, 3.5, 12, "y", 1, false);
    daisy(g, 11.5, 5, 3.5, 12, "y", 1, false);
    leaf(g, 8, 20, 1, 3);
    return g;
  },
  // boule dense aux bords dentelés, port trapu et feuillu
  chrysantheme: () => {
    const g = blank();
    stem(g, 8, 14);
    petals(g, 8, 11, 2, 5.5, 18, true);
    disk(g, 8, 11, 3.2, "P");
    disk(g, 8, 11, 1.8, "p");
    for (const [y, side] of [
      [17, -1],
      [17, 1],
      [20, -1],
      [20, 1],
      [22, -1],
    ] as const)
      leaf(g, 8, y, side, 4);
    return g;
  },
  // arbuste bas de rameaux couverts de clochettes
  bruyere: () => {
    const g = blank();
    [
      [3, 12],
      [6, 9],
      [8, 7],
      [10, 9],
      [13, 12],
    ].forEach(([x, top]) => {
      stem(g, x, top, 23);
      for (let y = top; y < 19; y += 2) {
        set(g, x - 1, y, "p");
        set(g, x + 1, y + 1, "P");
      }
    });
    return g;
  },
  // coupe allongée sans feuille, posée sur une tige courte
  colchique: () => {
    const g = blank();
    stem(g, 8, 16);
    for (let y = 5; y <= 15; y++) {
      const half = y < 11 ? 1 + (y - 5) * 0.5 : 4 - (y - 11) * 0.6;
      for (let x = Math.round(8 - half); x <= Math.round(8 + half); x++)
        set(g, x, y, x === 8 ? "P" : "p");
    }
    return g;
  },
  // cinq larges pétales ouverts autour d'un gros coeur sombre
  anemone: () => {
    const g = blank();
    stem(g, 8, 12);
    leaf(g, 8, 18, -1, 5);
    leaf(g, 8, 18, 1, 5);
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
      disk(g, 8 + Math.cos(a) * 3.2, 7 + Math.sin(a) * 3.2, 2, k % 2 ? "P" : "p");
    }
    disk(g, 8, 7, 1.8, "c");
    return g;
  },
  // dôme plat de fleurettes sur une tige épaisse aux feuilles charnues
  sedum: () => {
    const g = blank();
    stem(g, 7, 10);
    stem(g, 8, 10);
    for (const [y, x] of [
      [14, 5],
      [14, 10],
      [17, 4.5],
      [17, 10.5],
      [20, 5],
      [20, 10],
    ] as const)
      disk(g, x, y, 1.3, "l");
    for (let y = 5; y <= 9; y++)
      for (let x = 2; x <= 13; x++)
        if (((x - 7.5) / 6) ** 2 + ((y - 9.5) / 4.5) ** 2 <= 1)
          set(g, x, y, (x + y) % 2 ? "P" : "p");
    return g;
  },
  // longues grappes pendantes
  amarante: () => {
    const g = blank();
    stem(g, 5, 4);
    for (let i = 0; i < 5; i++) set(g, 6 + i, 3 + Math.abs(i - 2) * 0.3, "s");
    [
      [8, 15],
      [10, 18],
      [12, 14],
    ].forEach(([x, end]) => {
      for (let y = 4; y <= end; y++) {
        set(g, x, y, y % 2 ? "P" : "p");
        set(g, x + 1, y, y % 3 ? "p" : "P");
      }
    });
    leaf(g, 5, 19, -1, 4);
    return g;
  },
  // panache pyramidal de minuscules fleurs
  vergedor: () => {
    const g = blank();
    stem(g, 8, 6);
    for (let y = 1; y <= 14; y++) {
      const half = (y - 1) * 0.45;
      for (let x = 8 - half; x <= 8 + half; x += 2) set(g, x + (y % 2), y, y % 3 ? "p" : "P");
    }
    leaf(g, 8, 18, 1, 4);
    leaf(g, 8, 21, -1, 4);
    return g;
  },
  // marguerite moyenne aux pétales larges et au coeur conique
  heliopsis: () => {
    const g = blank();
    stem(g, 8, 11);
    leaf(g, 8, 16, 1, 3);
    leaf(g, 8, 20, -1, 3);
    daisy(g, 8, 8, 4.5, 10, "c", 1.8, true);
    set(g, 8, 5, "c");
    set(g, 8, 4, "c");
    return g;
  },
  // lanterne suspendue à une tige arquée
  lanternelune: () => {
    const g = blank();
    stem(g, 5, 4);
    for (let i = 0; i < 6; i++) set(g, 6 + i, 3 - Math.min(i, 5 - i) * 0.4, "s");
    set(g, 11, 4, "s");
    set(g, 11, 5, "s");
    for (let y = 6; y <= 15; y++)
      for (let x = 7; x <= 15; x++)
        if (((x - 11) / 3.4) ** 2 + ((y - 10.5) / 4.6) ** 2 <= 1)
          set(g, x, y, x === 10 || x === 12 ? "P" : "p");
    set(g, 11, 10, "y");
    leaf(g, 5, 20, -1, 4);
    return g;
  },
};

export const FLOWER_SHAPES = Object.fromEntries(
  Object.entries(SHAPES).map(([id, draw]) => [id, done(draw())]),
) as Record<SpeciesId, string[]>;

// graine en motte, pousse, plant, bouton fermé : rien ne trahit l'espèce
export const STAGE_SHAPES: string[][] = [
  (() => {
    const g = blank();
    for (let y = 20; y < H; y++)
      for (let x = 3; x <= 12; x++)
        if (((x - 7.5) / 5) ** 2 + ((y - 23) / 3.2) ** 2 <= 1) set(g, x, y, "m");
    set(g, 7, 20, "c");
    set(g, 8, 20, "c");
    return done(g);
  })(),
  (() => {
    const g = blank();
    stem(g, 8, 18);
    leaf(g, 8, 19, -1, 2);
    leaf(g, 8, 19, 1, 2);
    return done(g);
  })(),
  (() => {
    const g = blank();
    stem(g, 8, 12);
    leaf(g, 8, 15, -1, 3);
    leaf(g, 8, 18, 1, 3);
    leaf(g, 8, 21, -1, 3);
    return done(g);
  })(),
  (() => {
    const g = blank();
    stem(g, 8, 9);
    leaf(g, 8, 15, -1, 4);
    leaf(g, 8, 19, 1, 4);
    disk(g, 8, 7, 2.2, "b");
    set(g, 8, 4, "b");
    return done(g);
  })(),
];

// [clair, foncé] de chaque couleur de fleur
export const COLOR_HEX: Record<ColorId, [string, string]> = {
  yellow: ["#f2cc3a", "#c8961e"],
  pink: ["#f290b8", "#c85a86"],
  white: ["#f4f0e4", "#c8c0aa"],
  violet: ["#a46ad8", "#6e3ca4"],
  red: ["#e04a3a", "#a42820"],
  orange: ["#f2903a", "#c45e1e"],
  bronze: ["#c88a4a", "#8e5a2a"],
  heather: ["#b4508e", "#7e2e62"],
  lilac: ["#c8a8e8", "#9478c0"],
  blue: ["#5a8ae0", "#3458a8"],
  burgundy: ["#8e2a3e", "#5e1626"],
  apricot: ["#f8b888", "#d08a5a"],
  black: ["#3a2a3e", "#1e141e"],
  lime: ["#a8d85a", "#6ea432"],
};

// forme d'une espèce en une seule teinte, pour les entrées non découvertes de l'Herbier
export const silhouetteGrid = (species: SpeciesId): string[] =>
  FLOWER_SHAPES[species].map((row) => row.replace(/[^.]/g, "x"));

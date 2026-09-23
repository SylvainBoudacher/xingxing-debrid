import type { SlotSymbol } from "@/game/slots";

// Symboles du bandit manchot en pixel-art 16x16. Chaque lettre d'une grille est
// une couleur de la palette du symbole, "." est transparent. Les canards
// partagent une silhouette; chapeau, lunettes et étincelles se posent par-dessus.

type Grid = string[];
type Palette = Record<string, string>;

const INK = "#22222A";
const BEAK = "#F5811F";

const DUCK: Grid = [
  "................",
  "................",
  "................",
  ".........kkkk...",
  "........kBHBBk..",
  "........kBBkBk..",
  "........kBBBBOOk",
  "........kBBBBOk.",
  ".k......kBBBBk..",
  "kBk....kBBBBBk..",
  "kBBkkkkBBBBBBBk.",
  "kBBBBBBBBBBBBBk.",
  "kBBBBSSSSBBBBBk.",
  ".kSBBBBBBBBBSk..",
  "..kkkkkkkkkkk...",
  "................",
];

const WIZARD_HAT: Grid = [
  "...........k....",
  "..........kpk...",
  ".........kpypk..",
  ".......kPPPPPPk.",
];

const SHADES: Grid = [
  "................",
  "................",
  "................",
  "................",
  "................",
  ".........kkwkkk.",
];

const SPARKLE: Grid = [
  "..y.............",
  "..y.............",
  "yyWyy...........",
  "..y.............",
  "..y.......W.....",
  "..........H.....",
  "....y...........",
];

const SEVEN: Grid = [
  "................",
  "..kkkkkkkkkkkk..",
  "..kWWWWWWWWWWk..",
  "..kRRRRRRRRRRk..",
  "..kkkkkkkRRRRk..",
  ".......kRRRrk...",
  ".......kRRrk....",
  "......kRRRk.....",
  "......kRRrk.....",
  ".....kRRRk......",
  ".....kRRrk......",
  "....kRRRk.......",
  "....kRRrk.......",
  "....kkkkk.......",
  "................",
  "................",
];

const CROWN: Grid = [
  "................",
  "................",
  "................",
  ".k.....k.....k..",
  "kYk...kYk...kYk.",
  "kYYk.kYYYk.kYYk.",
  "kYYYkYYYYYkYYYk.",
  "kYYYYYYYYYYYYYk.",
  "kYYYYYYYYYYYYYk.",
  "kYYYYYwjjYYYYYk.",
  "kYjYYYjjjYYYjYk.",
  "kGGGGGGGGGGGGGk.",
  "kGGGGGGGGGGGGGk.",
  "kkkkkkkkkkkkkkk.",
  "................",
  "................",
];

function duck(body: string, light: string, shade: string): Palette {
  return { k: INK, O: BEAK, B: body, H: light, S: shade };
}

const ART: Record<SlotSymbol, { layers: Grid[]; palette: Palette }> = {
  seven: { layers: [SEVEN], palette: { k: INK, W: "#FFE9F2", R: "#FF3B7B", r: "#C21E5C" } },
  crown: {
    layers: [CROWN],
    palette: { k: INK, Y: "#F5C518", G: "#D08F00", j: "#FF3B7B", w: "#FFE9F2" },
  },
  golden: {
    layers: [DUCK, SPARKLE],
    palette: { ...duck("#E8A317", "#FFE27A", "#A86400"), y: "#FFE066", W: "#FFFFFF" },
  },
  wizard: {
    layers: [DUCK, WIZARD_HAT],
    palette: { ...duck("#C9A8FF", "#EBDDFF", "#9C7AE0"), p: "#5B3FA8", P: "#3E2B78", y: "#FFE066" },
  },
  glasses: {
    layers: [DUCK, SHADES],
    palette: { ...duck("#A7D8FF", "#E0F2FF", "#6FAEE0"), w: "#FFFFFF" },
  },
  duckling: { layers: [DUCK], palette: duck("#FFE35C", "#FFF6C0", "#E0B400") },
};

// Un tracé SVG par couleur (un carré par pixel), calculé une fois par symbole:
// un rouleau affiche une centaine de symboles, autant ne pas en faire des
// milliers de <rect>.
export type PixelPaths = Array<{ fill: string; d: string }>;

function toPaths({ layers, palette }: { layers: Grid[]; palette: Palette }): PixelPaths {
  const pixels = new Map<string, string>();
  for (const grid of layers) {
    grid.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c !== ".") pixels.set(`${x},${y}`, palette[c]);
      }),
    );
  }
  const byColor = new Map<string, string>();
  for (const [key, fill] of pixels) {
    const [x, y] = key.split(",");
    byColor.set(fill, `${byColor.get(fill) ?? ""}M${x} ${y}h1v1h-1z`);
  }
  return [...byColor].map(([fill, d]) => ({ fill, d }));
}

export const SYMBOL_PATHS = Object.fromEntries(
  Object.entries(ART).map(([s, art]) => [s, toPaths(art)]),
) as Record<SlotSymbol, PixelPaths>;

// Pommeau du levier, 10x10.
const KNOB: Grid = [
  "...kkkk...",
  ".kkRRRRkk.",
  ".kRWWRRRk.",
  "kRWWRRRRRk",
  "kRWRRRRRRk",
  "kRRRRRRRdk",
  "kRRRRRRddk",
  ".kRRRRddk.",
  ".kkddddkk.",
  "...kkkk...",
];

export const KNOB_PATHS = {
  on: toPaths({ layers: [KNOB], palette: { k: INK, R: "#F0584E", W: "#FFC2B8", d: "#A81B26" } }),
  off: toPaths({ layers: [KNOB], palette: { k: INK, R: "#7A6A6E", W: "#A8989C", d: "#554549" } }),
};

// Encoche de la ligne de paie (pointe à droite) et croix de fermeture, en une
// couleur: elles prennent la couleur du texte.
export const ARROW_PATHS = toPaths({
  layers: [["X...", "XX..", "XXX.", "XXXX", "XXX.", "XX..", "X..."]],
  palette: { X: "currentColor" },
});

export const CROSS_PATHS = toPaths({
  layers: [["X...X", ".X.X.", "..X..", ".X.X.", "X...X"]],
  palette: { X: "currentColor" },
});

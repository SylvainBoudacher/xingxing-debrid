// [masculin, féminin]
export const COLORS = {
  yellow: ["jaune", "jaune"],
  pink: ["rose", "rose"],
  white: ["blanc", "blanche"],
  violet: ["violet", "violette"],
  red: ["rouge", "rouge"],
  orange: ["orange", "orange"],
  bronze: ["bronze", "bronze"],
  heather: ["pourpre", "pourpre"],
  lilac: ["lilas", "lilas"],
  blue: ["bleu", "bleue"],
  burgundy: ["bordeaux", "bordeaux"],
  apricot: ["abricot", "abricot"],
  black: ["noir", "noire"],
  lime: ["vert", "verte"],
} as const satisfies Record<string, readonly [string, string]>;

export type ColorId = keyof typeof COLORS;

export const colorName = (color: ColorId, feminine: boolean): string =>
  COLORS[color][feminine ? 1 : 0];

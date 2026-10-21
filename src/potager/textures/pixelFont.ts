import { dot } from "./pixel";

// Police 3x5 : les enseignes ne dépendent d'aucune police chargée.
export const GLYPHS: Record<string, string> = {
  A: ".#.#.#####.##.#",
  B: "##.#.###.#.###.",
  C: ".###..#..#...##",
  D: "##.#.##.##.###.",
  E: "####..##.#..###",
  F: "####..##.#..#..",
  G: ".###..#.##.#.##",
  H: "#.##.#####.##.#",
  I: "###.#..#..#.###",
  J: "..#..#..##.#.#.",
  K: "#.##.###.#.##.#",
  L: "#..#..#..#..###",
  M: "#.########.##.#",
  N: "##.#.##.##.##.#",
  O: ".#.#.##.##.#.#.",
  P: "##.#.###.#..#..",
  Q: ".#.#.##.###..##",
  R: "##.#.###.#.##.#",
  S: ".###...#...###.",
  T: "###.#..#..#..#.",
  U: "#.##.##.##.####",
  V: "#.##.##.##.#.#.",
  W: "#.##.########.#",
  X: "#.##.#.#.#.##.#",
  Y: "#.##.#.#..#..#.",
  Z: "###..#.#.#..###",
  "0": "####.##.##.####",
  "1": ".#.##..#..#.###",
  "2": "##...#.#.#..###",
  "3": "##...#.#...###.",
  "4": "#.##.####..#..#",
  "5": "####..##...###.",
  "6": ".###..####.####",
  "7": "###..#.#..#..#.",
  "8": ".#.#.#.#.#.#.#.",
  "9": "####.####..###.",
};

export const textWidth = (text: string) => Math.max(0, text.length * 4 - 1);

// une lettre accentuée : la lettre de base, l'accent au-dessus (les enseignes sont en français)
export function glyphOf(ch: string): { glyph: string | undefined; accent: boolean } {
  const up = ch.toUpperCase();
  const base = up.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return { glyph: GLYPHS[base], accent: base !== up };
}

export function drawText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  [...text].forEach((ch, i) => {
    const { glyph, accent } = glyphOf(ch);
    if (!glyph) return;
    for (let k = 0; k < 15; k++)
      if (glyph[k] === "#") dot(g, x + i * 4 + (k % 3), y + Math.floor(k / 3), color);
    if (accent) dot(g, x + i * 4 + 1, y - 2, color, 2, 1);
  });
}

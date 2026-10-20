import { canvasTex, dot, outlineCanvas, pick } from "./pixel";

// Puits : margelle de pierre, deux montants, petit toit et seau.
export function puitsTex() {
  return canvasTex(28, 34, (g, rng) => {
    for (let y = 22; y < 34; y += 3)
      for (let x = 2 + ((y / 3) % 2) * 2; x < 26; x += 4)
        dot(g, x, y, pick(rng, ["#9a9aa2", "#8a8a92", "#aaaab2"]), 3, 2);
    dot(g, 3, 20, "#2a3a4a", 22, 2);
    dot(g, 4, 6, "#6a4628", 2, 16);
    dot(g, 22, 6, "#6a4628", 2, 16);
    for (let y = 0; y < 6; y++) dot(g, 7 - y, y, "#7a3018", 14 + y * 2, 1);
    dot(g, 6, 9, "#5a3820", 16, 2);
    dot(g, 14, 11, "#c8b080", 1, 5);
    dot(g, 12, 16, "#9a6a3a", 5, 4);
    outlineCanvas(g, 28, 34);
  });
}

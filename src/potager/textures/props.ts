import { canvasTex, dot, outlineCanvas, pick } from "./pixel";

// Abri de jardin vu de face : bardage, toit, râtelier d'outils et coffre.
export function abriTex() {
  return canvasTex(36, 34, (g, rng) => {
    for (let x = 2; x < 34; x += 3)
      dot(g, x, 12, pick(rng, ["#8a5a34", "#7a4e2c", "#946238"]), 3, 22);
    for (let x = 2; x < 34; x += 3) dot(g, x, 12, "#5a3820", 1, 22);
    for (let y = 0; y < 12; y++) dot(g, 12 - y, y, "#7a3018", 12 + y * 2 + 0, 1);
    for (let y = 2; y < 12; y += 3) dot(g, 13 - y, y, "#c8642e", 10 + y * 2, 1);
    dot(g, 4, 18, "#3a2414", 13, 13);
    dot(g, 5, 19, "#c8b080", 1, 11);
    dot(g, 9, 19, "#5a8ab8", 3, 6);
    dot(g, 13, 19, "#9aa0a8", 2, 4);
    dot(g, 13, 23, "#7a5434", 1, 7);
    dot(g, 19, 25, "#6a4628", 12, 7);
    dot(g, 19, 25, "#8a6a3a", 12, 2);
    dot(g, 24, 27, "#e8c060", 2, 2);
    outlineCanvas(g, 36, 34);
  });
}

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

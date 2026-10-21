import { canvasTex, dot, outlineCanvas } from "./pixel";

// petits objets portés au-dessus de la tête d'un employé
export function canIconTex() {
  return canvasTex(10, 8, (g) => {
    dot(g, 1, 2, "#8a9aa8", 6, 5);
    dot(g, 1, 2, "#b8c8d4", 6, 1);
    dot(g, 7, 3, "#8a9aa8", 2, 1);
    dot(g, 8, 2, "#8a9aa8", 1, 1);
    dot(g, 2, 0, "#5a6a78", 4, 1);
    outlineCanvas(g, 10, 8);
  });
}

// sachet teinté par la rareté seule : rien ne trahit l'espèce
export function pouchIconTex(color: string) {
  return canvasTex(8, 9, (g) => {
    dot(g, 1, 2, color, 6, 6);
    dot(g, 2, 0, color, 4, 2);
    dot(g, 1, 7, "#00000040", 6, 1);
    outlineCanvas(g, 8, 9);
  });
}

export function flowerIconTex(color: string) {
  return canvasTex(9, 9, (g) => {
    dot(g, 4, 5, "#4f7a2e", 1, 4);
    for (const [x, y] of [
      [3, 1],
      [5, 1],
      [2, 3],
      [6, 3],
      [3, 4],
      [5, 4],
    ])
      dot(g, x, y, color, 1, 1);
    dot(g, 4, 2, "#f2c03a", 1, 2);
    outlineCanvas(g, 9, 9);
  });
}

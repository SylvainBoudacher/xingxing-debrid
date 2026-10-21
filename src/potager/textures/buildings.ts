import { canvasTex, dot, outlineCanvas, pick, range } from "./pixel";
import { drawText, textWidth } from "./pixelFont";

function bricks(
  g: CanvasRenderingContext2D,
  w: number,
  y0: number,
  y1: number,
  c: string,
  hi?: string,
) {
  for (let y = y0; y < y1; y += 3)
    for (let x = (y % 2) * 3 - 3; x < w; x += 6) {
      dot(g, x, y, c, 5, 2);
      if (hi) dot(g, x, y, hi, 5, 1);
    }
}

function tiles(g: CanvasRenderingContext2D, rng: () => number, w: number, h: number) {
  for (let y = 0; y < h; y += 5) {
    const off = (y / 5) % 2 ? 3 : 0;
    for (let x = -off; x < w; x += 6) {
      dot(g, x, y, pick(rng, ["#c8642e", "#b8562a", "#d47436", "#a84a24"]), 6, 5);
      dot(g, x, y, "#e8945a", 5, 1);
      dot(g, x + 5, y, "#7a3018", 1, 5);
    }
    dot(g, 0, y + 4, "#6a2a14", w, 1);
  }
}

// Étal du fleuriste : façade crépie, auvent vert, vitrine de bouquets.
export function etalTextures() {
  const front = canvasTex(56, 40, (g, rng) => {
    dot(g, 0, 0, "#e6d8b8", 56, 40);
    for (let i = 0; i < 70; i++)
      dot(
        g,
        Math.floor(range(rng, 0, 55)),
        Math.floor(range(rng, 8, 30)),
        pick(rng, ["#d4c4a0", "#f0e4c8"]),
        2,
        1,
      );
    bricks(g, 56, 30, 40, "#9a5a3a", "#b4704a");
    for (let x = 0; x < 56; x++) dot(g, x, 0, x % 8 < 4 ? "#3a8a6a" : "#f2ecd8", 1, 5);
    for (let x = 0; x < 56; x += 4) {
      dot(g, x, 5, "#3a8a6a", 4, 1);
      dot(g, x + 1, 6, "#3a8a6a", 2, 1);
    }
    dot(g, 32, 12, "#4a2c18", 14, 28);
    dot(g, 33, 13, "#7a4a28", 12, 27);
    for (let x = 35; x < 45; x += 3) dot(g, x, 14, "#5a3820", 1, 25);
    dot(g, 42, 26, "#e8c050", 2, 2);
    dot(g, 7, 13, "#4a2c18", 18, 14);
    dot(g, 8, 14, "#6ab0c0", 16, 12);
    dot(g, 8, 14, "#a8dce4", 16, 2);
    dot(g, 15, 14, "#4a2c18", 2, 12);
    dot(g, 8, 19, "#4a2c18", 16, 1);
    dot(g, 7, 27, "#6a4426", 18, 2);
    for (const [c, x] of [
      ["#e0503e", 9],
      ["#f2c03a", 13],
      ["#d65a9a", 17],
      ["#8a6ad8", 21],
    ] as const) {
      dot(g, x, 25, c, 2, 2);
      dot(g, x, 27, "#4f7a2e", 1, 1);
    }
  });
  const side = canvasTex(40, 40, (g, rng) => {
    dot(g, 0, 0, "#d8c8a4", 40, 40);
    for (let i = 0; i < 50; i++)
      dot(
        g,
        Math.floor(range(rng, 0, 39)),
        Math.floor(range(rng, 0, 30)),
        pick(rng, ["#c8b890", "#e4d6b4"]),
        2,
        1,
      );
    bricks(g, 40, 30, 40, "#8a4e32");
    dot(g, 0, 0, "#6a4426", 2, 40);
    dot(g, 38, 0, "#6a4426", 2, 40);
  });
  const roof = canvasTex(64, 40, (g, rng) => tiles(g, rng, 64, 40));
  return { front, side, roof, gable: "#cdb890" };
}

function planks(g: CanvasRenderingContext2D, rng: () => number, w: number, h: number) {
  for (let x = 0; x < w; x += 4) {
    dot(g, x, 0, pick(rng, ["#8a6038", "#9a6c40", "#7e5630"]), 4, h);
    dot(g, x, 0, "#5a3a20", 1, h);
    for (let k = 0; k < 2; k++) dot(g, x + 2, Math.floor(range(rng, 2, h - 2)), "#6a4628", 1, 2);
  }
}

// Cabane à graines : planches, toit de chaume, sachets en vitrine.
export function cabaneTextures() {
  const front = canvasTex(40, 32, (g, rng) => {
    planks(g, rng, 40, 32);
    dot(g, 24, 10, "#3a2414", 11, 22);
    dot(g, 25, 11, "#6a4224", 9, 21);
    dot(g, 25, 20, "#4a2c18", 9, 1);
    dot(g, 31, 21, "#e8c050", 1, 2);
    dot(g, 4, 11, "#3a2414", 15, 11);
    dot(g, 5, 12, "#2a3a3a", 13, 9);
    for (const [c, x, y] of [
      ["#e8c060", 6, 14],
      ["#d65a5a", 9, 13],
      ["#6aa04a", 12, 14],
      ["#8a6ad8", 15, 13],
    ] as const) {
      dot(g, x, y, c, 2, 4);
      dot(g, x, y, "#fff4dc", 2, 1);
    }
    dot(g, 4, 22, "#5a3a20", 15, 2);
  });
  const side = canvasTex(32, 32, (g, rng) => planks(g, rng, 32, 32));
  const roof = canvasTex(48, 32, (g, rng) => {
    dot(g, 0, 0, "#b8903c", 48, 32);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(range(rng, 0, 48)),
        y = Math.floor(range(rng, 0, 32));
      dot(
        g,
        x,
        y,
        pick(rng, ["#d4ac54", "#a07a30", "#c89c48", "#8a6626"]),
        1,
        Math.floor(range(rng, 2, 5)),
      );
    }
    for (let y = 7; y < 32; y += 8) dot(g, 0, y, "#7a5a22", 48, 1);
  });
  return { front, side, roof, gable: "#8a6038" };
}

// Maison des employés : colombages sur crépi ocre, porte bleue, deux fenêtres fleuries.
export function maisonTextures() {
  const beams = (g: CanvasRenderingContext2D, w: number, h: number) => {
    for (const x of [0, Math.floor(w / 2) - 1, w - 2]) dot(g, x, 0, "#5a3820", 2, h - 8);
    dot(g, 0, 0, "#5a3820", w, 2);
    dot(g, 0, Math.floor((h - 8) / 2), "#5a3820", w, 2);
  };
  const front = canvasTex(52, 40, (g, rng) => {
    dot(g, 0, 0, "#e0b878", 52, 40);
    for (let i = 0; i < 60; i++)
      dot(
        g,
        Math.floor(range(rng, 0, 51)),
        Math.floor(range(rng, 2, 31)),
        pick(rng, ["#d4a868", "#ecc890"]),
        2,
        1,
      );
    bricks(g, 52, 32, 40, "#7a6a5a", "#948474");
    beams(g, 52, 40);
    dot(g, 20, 14, "#3a2414", 12, 18);
    dot(g, 21, 15, "#3a6a9a", 10, 17);
    dot(g, 21, 15, "#5a8aba", 10, 2);
    dot(g, 29, 24, "#e8c050", 1, 2);
    for (const x of [5, 38]) {
      dot(g, x, 8, "#3a2414", 10, 9);
      dot(g, x + 1, 9, "#6ab0c0", 8, 7);
      dot(g, x + 4, 9, "#3a2414", 1, 7);
      dot(g, x, 17, "#6a4426", 10, 2);
      dot(g, x + 1, 16, "#e0503e", 2, 1);
      dot(g, x + 6, 16, "#f2c03a", 2, 1);
    }
  });
  const side = canvasTex(40, 40, (g, rng) => {
    dot(g, 0, 0, "#d8b070", 40, 40);
    for (let i = 0; i < 40; i++)
      dot(
        g,
        Math.floor(range(rng, 0, 39)),
        Math.floor(range(rng, 2, 31)),
        pick(rng, ["#c8a060", "#e4c088"]),
        2,
        1,
      );
    bricks(g, 40, 32, 40, "#6a5a4a");
    beams(g, 40, 40);
  });
  const roof = canvasTex(64, 40, (g, rng) => {
    for (let y = 0; y < 40; y += 5) {
      const off = (y / 5) % 2 ? 3 : 0;
      for (let x = -off; x < 64; x += 6) {
        dot(g, x, y, pick(rng, ["#4a5a6a", "#56687a", "#3e4e5e"]), 6, 5);
        dot(g, x, y, "#7a8c9c", 5, 1);
      }
      dot(g, 0, y + 4, "#2a3440", 64, 1);
    }
  });
  return { front, side, roof, gable: "#d0a868" };
}

// Petit piquet planté au bord d'une parcelle possédée, avec un fanion.
export function stakeTex() {
  return canvasTex(10, 20, (g) => {
    dot(g, 4, 3, "#6a4628", 2, 17);
    dot(g, 5, 3, "#8a6038", 1, 17);
    dot(g, 6, 3, "#3a8a6a", 3, 4);
    dot(g, 6, 3, "#5aaa8a", 3, 1);
    outlineCanvas(g, 10, 20);
  });
}

export function signTex(text: string) {
  const w = textWidth(text) + 8;
  return canvasTex(w, 11, (g) => {
    dot(g, 1, 1, "#e8dcc0", w - 2, 9);
    dot(g, 1, 9, "#c8b48c", w - 2, 1);
    drawText(g, text, 4, 3, "#4a2c18");
    outlineCanvas(g, w, 11);
  });
}

// Panneau de bois planté dans le sol, prix d'une parcelle à vendre.
export function priceSignTex(price: number) {
  const text = `${price} PO`;
  const w = textWidth(text) + 8;
  const h = 24;
  return canvasTex(w, h, (g) => {
    dot(g, Math.floor(w / 2) - 1, 12, "#6a4628", 2, 12);
    dot(g, 1, 1, "#b8924e", w - 2, 11);
    dot(g, 1, 11, "#8a6a3a", w - 2, 1);
    drawText(g, text, 4, 3, "#3a2010");
    outlineCanvas(g, w, h);
  });
}

// Abri de jardin : bardage, fenêtre avec râtelier d'outils, coffre, toit de tuiles brunes.
export function abriTextures() {
  const front = canvasTex(36, 32, (g, rng) => {
    planks(g, rng, 36, 32);
    dot(g, 3, 7, "#3a2414", 13, 13);
    dot(g, 4, 8, "#c8b080", 1, 11);
    dot(g, 8, 9, "#5a8ab8", 3, 6);
    dot(g, 12, 9, "#9aa0a8", 2, 4);
    dot(g, 12, 13, "#7a5434", 1, 7);
    dot(g, 19, 16, "#6a4628", 12, 8);
    dot(g, 19, 16, "#8a6a3a", 12, 2);
    dot(g, 24, 19, "#e8c060", 2, 2);
  });
  const side = canvasTex(32, 32, (g, rng) => planks(g, rng, 32, 32));
  const roof = canvasTex(48, 32, (g, rng) => {
    dot(g, 0, 0, "#8a3a20", 48, 32);
    for (let y = 0; y < 32; y += 4) dot(g, 0, y, y % 8 === 0 ? "#c8642e" : "#7a3018", 48, 2);
    for (let i = 0; i < 80; i++)
      dot(g, Math.floor(range(rng, 0, 48)), Math.floor(range(rng, 0, 32)), "#a04a28", 2, 1);
  });
  return { front, side, roof, gable: "#7a4e2c" };
}

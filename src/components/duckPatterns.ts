import { fillEll } from "./duckDraw";
import type { Variant } from "./duckTypes";

// The body fill for a variant. Most patterns tint the base color via an
// overlay (see paintPattern); rainbow/gold/galaxy replace the fill entirely.
export function bodyFill(c: CanvasRenderingContext2D, v: Variant): string | CanvasGradient {
  if (v.pattern === "rainbow") {
    const rg = c.createLinearGradient(8, 14, 120, 110);
    rg.addColorStop(0.0, "#FF5C5C");
    rg.addColorStop(0.2, "#FF9A3C");
    rg.addColorStop(0.4, "#FFE14D");
    rg.addColorStop(0.6, "#5EE6A8");
    rg.addColorStop(0.8, "#4FB0F0");
    rg.addColorStop(1.0, "#A78BFA");
    return rg;
  }
  if (v.pattern === "gold") {
    const gg = c.createLinearGradient(0, 48, 0, 116);
    gg.addColorStop(0, "#FFF3B0");
    gg.addColorStop(0.5, "#F5C518");
    gg.addColorStop(1, "#B8860B");
    return gg;
  }
  if (v.pattern === "galaxy") {
    const gx = c.createLinearGradient(10, 12, 110, 112);
    gx.addColorStop(0, "#3B2E66");
    gx.addColorStop(0.5, "#1E1B3A");
    gx.addColorStop(1, "#0B1030");
    return gx;
  }
  if (v.pattern === "ember") {
    // braise: blanc incandescent sur le dessus, cramoisi dans les creux
    const eg = c.createLinearGradient(0, 16, 0, 130);
    eg.addColorStop(0, "#FFF7DC");
    eg.addColorStop(0.34, "#FFCF5C");
    eg.addColorStop(0.66, "#F4691F");
    eg.addColorStop(1, "#8C1A10");
    return eg;
  }
  if (v.pattern === "neon") {
    // velours de casino: rouge profond, plus sombre vers le bas
    const ng = c.createLinearGradient(0, 16, 0, 130);
    ng.addColorStop(0, "#8E1730");
    ng.addColorStop(0.55, "#5E0E20");
    ng.addColorStop(1, "#2E0511");
    return ng;
  }
  if (v.pattern === "abyss") {
    const ax = c.createLinearGradient(10, 12, 110, 112);
    ax.addColorStop(0, "#071828");
    ax.addColorStop(0.5, "#040F1C");
    ax.addColorStop(1, "#020810");
    return ax;
  }
  return v.body;
}

// Draw a pattern overlay clipped to an ellipse (the body or the head).
// rainbow/gold are handled by bodyFill and draw no overlay here.
export function paintPattern(
  c: CanvasRenderingContext2D,
  v: Variant,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  if (!v.pattern || v.pattern === "rainbow" || v.pattern === "gold") return;
  c.save();
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  const x0 = cx - rx;
  const y0 = cy - ry;
  if (v.pattern === "spots") {
    c.fillStyle = "rgba(0,0,0,0.32)";
    for (let i = 0; i < 6; i++) {
      const px = x0 + Math.random() * rx * 2;
      const py = y0 + Math.random() * ry * 2;
      fillEll(c, px, py, 4 + Math.random() * 7, 4 + Math.random() * 6, "rgba(0,0,0,0.32)");
    }
  } else if (v.pattern === "stripes") {
    c.fillStyle = "rgba(0,0,0,0.2)";
    for (let s = -ry * 2; s < rx * 2; s += 14) {
      c.beginPath();
      c.moveTo(x0 + s, y0 + ry * 2);
      c.lineTo(x0 + s + 6, y0 + ry * 2);
      c.lineTo(x0 + s + 6 + ry * 2, y0);
      c.lineTo(x0 + s + ry * 2, y0);
      c.closePath();
      c.fill();
    }
  } else if (v.pattern === "polka") {
    c.fillStyle = "rgba(255,255,255,0.6)";
    for (let py = y0; py < y0 + ry * 2; py += 12) {
      for (let px = x0; px < x0 + rx * 2; px += 12) {
        fillEll(c, px + (((py / 12) | 0) % 2) * 6, py, 2.4, 2.4, "rgba(255,255,255,0.6)");
      }
    }
  } else if (v.pattern === "galaxy") {
    for (let i = 0; i < 14; i++) {
      const px = x0 + Math.random() * rx * 2;
      const py = y0 + Math.random() * ry * 2;
      const r = Math.random() < 0.25 ? 1.6 : 0.8;
      fillEll(c, px, py, r, r, `rgba(255,255,255,${0.5 + Math.random() * 0.5})`);
    }
  } else if (v.pattern === "zombie") {
    c.strokeStyle = "rgba(40,60,30,0.55)";
    c.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const px = x0 + 6 + Math.random() * (rx * 2 - 12);
      const py = y0 + 6 + Math.random() * (ry * 2 - 12);
      c.beginPath();
      c.moveTo(px - 5, py);
      c.lineTo(px + 5, py);
      for (let k = -4; k <= 4; k += 2.5) {
        c.moveTo(px + k, py - 2.5);
        c.lineTo(px + k, py + 2.5);
      }
      c.stroke();
    }
    fillEll(c, cx - rx * 0.3, cy + ry * 0.2, 6, 5, "rgba(40,70,30,0.3)");
  } else if (v.pattern === "metal") {
    c.strokeStyle = "rgba(0,0,0,0.22)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(cx, y0);
    c.lineTo(cx, y0 + ry * 2);
    c.moveTo(x0, cy);
    c.lineTo(x0 + rx * 2, cy);
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.5)";
    for (const [bx, by] of [
      [cx - rx * 0.5, cy - ry * 0.4],
      [cx + rx * 0.5, cy - ry * 0.4],
      [cx - rx * 0.5, cy + ry * 0.4],
      [cx + rx * 0.5, cy + ry * 0.4],
    ]) {
      fillEll(c, bx, by, 1.6, 1.6, "rgba(255,255,255,0.5)");
    }
  } else if (v.pattern === "scales") {
    // peau de reptile: rangées d'écailles en arcs, décalées d'une rangée à
    // l'autre, avec un liseré clair au-dessus pour le relief
    const step = 9;
    c.lineWidth = 1.2;
    for (let py = y0; py < y0 + ry * 2 + step; py += step * 0.62) {
      const row = Math.round((py - y0) / (step * 0.62));
      for (let px = x0 - step; px < x0 + rx * 2 + step; px += step) {
        const ox = px + (row % 2 ? step / 2 : 0);
        c.strokeStyle = "rgba(0,0,0,0.3)";
        c.beginPath();
        c.arc(ox, py, step * 0.5, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.3)";
        c.beginPath();
        c.arc(ox, py - 1.3, step * 0.5, Math.PI * 0.2, Math.PI * 0.8);
        c.stroke();
      }
    }
  } else if (v.pattern === "ember") {
    // plumes carbonisées par endroits, et éclats de braise encore vifs
    c.strokeStyle = "rgba(70,12,6,0.32)";
    c.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const px = x0 + Math.random() * rx * 2;
      const py = y0 + Math.random() * ry * 2;
      c.beginPath();
      c.moveTo(px, py);
      c.quadraticCurveTo(px + 5, py + 4, px + 2, py + 10);
      c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const px = x0 + Math.random() * rx * 2;
      const py = y0 + Math.random() * ry * 2;
      fillEll(c, px, py, 1.5, 1.5, `rgba(255,${210 + Math.random() * 40},150,0.85)`);
    }
  } else if (v.pattern === "neon") {
    // trois tubes de néon posés sur le velours: un liseré sombre pour le creux
    // puis le tube coloré. Les épaisseurs suivent le rayon, sinon la tête (qui
    // reçoit le même motif que le corps) disparaît sous les traits.
    const k = rx / 55;
    const tubes = [
      ["#FF3B7B", -0.42],
      ["#41E8FF", 0.06],
      ["#FFD24D", 0.54],
    ] as const;
    c.lineCap = "round";
    for (const [color, off] of tubes) {
      const px = cx + rx * off;
      const sweep = rx * 0.14;
      const trace = () => {
        c.beginPath();
        c.moveTo(px, cy - ry * 0.72);
        c.quadraticCurveTo(px + sweep, cy, px - sweep * 0.6, cy + ry * 0.72);
      };
      c.strokeStyle = "rgba(0,0,0,0.3)";
      c.lineWidth = 3.6 * k;
      trace();
      c.stroke();
      c.strokeStyle = color;
      c.lineWidth = 1.8 * k;
      trace();
      c.stroke();
    }
  } else if (v.pattern === "mallard") {
    // livrée de colvert: tête vert bouteille, collier blanc au cou, et la
    // chemise hawaïenne sur tout le corps (seule la queue, dessinée hors du
    // clip, garde le brun). paintPattern est appelé une fois pour la tête (un
    // cercle) et une fois pour le corps (une ellipse), d'où le test rx === ry.
    const head = rx === ry;
    if (head) {
      fillEll(c, cx, cy, rx, ry, "#4E6B33");
      fillEll(c, cx - rx * 0.12, cy + ry * 0.88, rx * 0.9, ry * 0.16, "#F2EFE6"); // collier
    } else {
      paintHawaiianShirt(c, cx, cy, rx, ry);
    }
    // les aplats ont recouvert l'ombrage du sprite: on le redessine
    const hx = cx - rx * 0.45;
    const hy = cy - ry * 0.5;
    const hi = c.createRadialGradient(hx, hy, 2, hx, hy, rx * 0.8);
    hi.addColorStop(0, `rgba(255,255,255,${head ? 0.32 : 0.2})`);
    hi.addColorStop(1, "rgba(255,255,255,0)");
    fillEll(c, hx, hy, rx * 0.8, ry * 0.8, hi);
    const sx = cx + rx * 0.4;
    const sy = cy + ry * 0.7;
    const sh = c.createRadialGradient(sx, sy, 2, sx, sy, rx);
    sh.addColorStop(0, "rgba(0,0,0,0.26)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    fillEll(c, sx, sy, rx, ry, sh);
  } else if (v.pattern === "abyss") {
    // bioluminescent spots drifting in the deep
    const bioColors = ["rgba(0,255,180,0.75)", "rgba(0,200,255,0.65)", "rgba(120,255,200,0.55)"];
    for (let i = 0; i < 10; i++) {
      const px = x0 + Math.random() * rx * 2;
      const py = y0 + Math.random() * ry * 2;
      const r = Math.random() < 0.3 ? 2.2 : 1.1;
      fillEll(c, px, py, r, r, bioColors[i % bioColors.length]);
    }
  }
  c.restore();
}

// La chemise hawaïenne de MrCoinCoin: elle habille tout le corps, avec des
// fleurs posées à des positions fixes — le sprite n'est cuit qu'une fois, mais
// deux canards de la même récompense doivent se ressembler. Pas de col: la tête
// couvre tout le poitrail au-dessus de la ligne du corps.
const FLOWERS: [number, number][] = [
  [-0.62, -0.3],
  [-0.2, 0.3],
  [0.2, -0.45],
  [0.62, 0.25],
  [-0.4, 0.62],
  [0.1, 0.72],
  [0.5, -0.55],
  [-0.75, 0.25],
];

function paintHawaiianShirt(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  fillEll(c, cx, cy, rx, ry, "#1FA8A0");
  // couture d'épaule, là où la manche rejoint le corps
  c.strokeStyle = "rgba(0,0,0,0.16)";
  c.lineWidth = rx * 0.05;
  c.beginPath();
  c.moveTo(cx + rx * 0.28, cy - ry);
  c.quadraticCurveTo(cx + rx * 0.02, cy + ry * 0.1, cx + rx * 0.34, cy + ry);
  c.stroke();

  // fleurs: cinq pétales autour d'un cœur jaune
  for (const [fx, fy] of FLOWERS) {
    const px = cx + rx * 0.82 * fx;
    const py = cy + ry * 0.8 * fy;
    const pr = rx * 0.055;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      fillEll(c, px + Math.cos(a) * pr, py + Math.sin(a) * pr, pr * 0.8, pr * 0.8, "#FF7A6B");
    }
    fillEll(c, px, py, pr * 0.55, pr * 0.55, "#FFE066");
  }
}

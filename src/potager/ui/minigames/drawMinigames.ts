import type { ArroserView } from "../../core/minigames/arroser";
import type { BecherView } from "../../core/minigames/becher";
import type { CueillirView } from "../../core/minigames/cueillir";
import type { PuitsView } from "../../core/minigames/puits";
import type { SemerView } from "../../core/minigames/semer";

// Dessins des mini-jeux, repris des maquettes validées (toile de 320 x 180).
export const MW = 320,
  MH = 180;
const C = {
  grass: "#3a5a2c",
  soil: "#6a4a30",
  soilDark: "#3e2a1a",
  gold: "#e8c060",
  ink: "#f1e6d2",
  ok: "#7ab05a",
  mid: "#d8b048",
  bad: "#c8604a",
  well: "#1e140c",
};

const bg = (c: CanvasRenderingContext2D) => {
  c.fillStyle = C.grass;
  c.fillRect(0, 0, MW, MH);
};
const txt = (
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  col = C.ink,
  size = 18,
) => {
  c.fillStyle = col;
  c.font = `bold ${size}px Georgia`;
  c.textAlign = "center";
  c.fillText(s, x, y);
};

export function drawBecher(c: CanvasRenderingContext2D, v: BecherView) {
  bg(c);
  c.fillStyle = C.soil;
  c.fillRect(110, 40, 100, 100);
  v.hits.forEach((h, i) => {
    if (h) {
      c.fillStyle = C.soilDark;
      c.fillRect(118 + i * 30, 50, 24, 80);
    }
    txt(
      c,
      h === 2 ? "+" : h === 1 ? "~" : "x",
      130 + i * 30,
      168,
      h === 2 ? C.ok : h === 1 ? C.mid : C.bad,
      16,
    );
  });
  if (!v.active) return;
  c.lineWidth = 3;
  c.strokeStyle = C.gold;
  c.beginPath();
  c.arc(160, 90, v.target, 0, 7);
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = C.ink;
  c.beginPath();
  c.arc(160, 90, Math.max(2, v.radius), 0, 7);
  c.stroke();
}

export function drawSemer(c: CanvasRenderingContext2D, v: SemerView) {
  bg(c);
  c.fillStyle = C.soil;
  c.fillRect(30, 110, 260, 34);
  c.fillStyle = "rgba(216,176,72,.35)";
  c.fillRect(v.hole - 42, 104, 84, 46);
  c.fillStyle = "rgba(122,176,90,.7)";
  c.fillRect(v.hole - 18, 104, 36, 46);
  c.fillStyle = C.soilDark;
  c.fillRect(v.hole - 10, 116, 20, 10);
  c.fillStyle = "#c89a5a";
  c.beginPath();
  c.ellipse(v.x, v.dropped ? 121 : 70, 5, 7, 0, 0, 7);
  c.fill();
}

export function drawArroser(c: CanvasRenderingContext2D, v: ArroserView) {
  bg(c);
  const k = v.level;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
  c.fillStyle = `rgb(${mix(106, 50)},${mix(74, 30)},${mix(48, 18)})`;
  c.fillRect(100, 50, 90, 90);
  if (v.pouring) {
    c.fillStyle = "#7ab0d8";
    for (let i = 0; i < 6; i++) c.fillRect(140 + Math.random() * 20, 20 + Math.random() * 30, 2, 6);
  }
  const top = 30,
    h = 130;
  c.fillStyle = C.well;
  c.fillRect(230, top, 22, h);
  c.fillStyle = "rgba(122,176,90,.45)";
  c.fillRect(232, top + h * (1 - v.zone[1]), 18, h * (v.zone[1] - v.zone[0]));
  c.fillStyle = C.ok;
  c.fillRect(232, top + h * (1 - v.ideal[1]), 18, h * (v.ideal[1] - v.ideal[0]));
  c.fillStyle = "#5a8ab8";
  c.fillRect(234, top + h - 2 - (h - 4) * k, 14, (h - 4) * k);
}

const ANGLE: Record<string, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

function arrow(c: CanvasRenderingContext2D, dir: string, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.rotate(ANGLE[dir]);
  c.fillStyle = C.ink;
  c.fillRect(-8, -2, 9, 4);
  c.beginPath();
  c.moveTo(9, 0);
  c.lineTo(0, -7);
  c.lineTo(0, 7);
  c.fill();
  c.restore();
}

export function drawCueillir(c: CanvasRenderingContext2D, v: CueillirView) {
  bg(c);
  c.fillStyle = "#4a7a3a";
  c.fillRect(158, 90, 4, 60);
  c.fillStyle = "#d8506a";
  for (let a = 0; a < 6; a++) {
    c.beginPath();
    c.arc(160 + Math.cos(a) * 12, 80 + Math.sin(a) * 12, 9, 0, 7);
    c.fill();
  }
  c.fillStyle = C.gold;
  c.beginPath();
  c.arc(160, 80, 7, 0, 7);
  c.fill();
  v.sequence.forEach((k, j) => {
    c.fillStyle = j < v.done ? C.ok : C.well;
    c.fillRect(110 + j * 36, 20, 30, 30);
    arrow(c, k, 125 + j * 36, 35);
  });
  c.fillStyle = C.well;
  c.fillRect(60, 166, 200, 8);
  c.fillStyle = C.mid;
  c.fillRect(62, 168, 196 * v.timeLeft, 4);
}

export function drawPuits(c: CanvasRenderingContext2D, v: PuitsView) {
  bg(c);
  c.fillStyle = "#8a8a90";
  c.fillRect(100, 130, 120, 40);
  c.fillStyle = "#1e2a3a";
  c.fillRect(110, 130, 100, 10);
  c.fillStyle = "#6a4a30";
  c.fillRect(102, 20, 8, 112);
  c.fillRect(210, 20, 8, 112);
  c.fillRect(98, 16, 124, 8);
  const by = 140 - v.height * 105;
  c.strokeStyle = "#c8b080";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(160, 24);
  c.lineTo(160, by);
  c.stroke();
  c.save();
  c.translate(160, by);
  c.rotate(v.angle * 0.9);
  c.fillStyle = "#9a6a3a";
  c.fillRect(-14, 0, 28, 20);
  c.fillStyle = "#5a8ab8";
  c.fillRect(-12, 2 + 16 * (1 - v.water), 24, 16 * v.water);
  c.restore();
  c.fillStyle = C.well;
  c.fillRect(250, 20, 14, 140);
  c.fillStyle = "#5a8ab8";
  c.fillRect(252, 158 - 136 * v.water, 10, 136 * v.water);
}

export const GRADE_LABEL = {
  parfait: ["Parfait !", C.ok],
  bien: ["Bien", C.mid],
  rate: ["Raté", C.bad],
} as const;

export function drawGrade(c: CanvasRenderingContext2D, grade: keyof typeof GRADE_LABEL) {
  c.fillStyle = "rgba(20,14,10,.55)";
  c.fillRect(0, MH / 2 - 26, MW, 44);
  const [label, col] = GRADE_LABEL[grade];
  txt(c, label, MW / 2, MH / 2 + 6, col, 24);
}

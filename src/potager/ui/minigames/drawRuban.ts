import type { RubanView } from "../../core/minigames/ruban";
import { MH, MW } from "./drawMinigames";

const R = 62;
const at = (a: number, r: number) => ({
  x: MW / 2 + Math.sin(a) * r,
  y: MH / 2 - Math.cos(a) * r,
});

export function drawRuban(c: CanvasRenderingContext2D, v: RubanView) {
  c.fillStyle = "#3a5a2c";
  c.fillRect(0, 0, MW, MH);
  c.fillStyle = "#6a4a30";
  c.beginPath();
  c.arc(MW / 2, MH / 2, R + 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#3e2a1a";
  c.lineWidth = 4;
  c.beginPath();
  c.arc(MW / 2, MH / 2, R, 0, Math.PI * 2);
  c.stroke();
  const k = at(v.knot, R);
  c.fillStyle = "#e8c060";
  c.beginPath();
  c.arc(k.x, k.y, 9, 0, Math.PI * 2);
  c.fill();
  const n = at(v.angle, R - 4);
  c.strokeStyle = "#f1e6d2";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(MW / 2, MH / 2);
  c.lineTo(n.x, n.y);
  c.stroke();
  v.hits.forEach((h, i) => {
    c.fillStyle = h === 2 ? "#7ab05a" : h === 1 ? "#d8b048" : "#c8604a";
    c.beginPath();
    c.arc(MW / 2 - 10 + i * 20, MH - 14, 6, 0, Math.PI * 2);
    c.fill();
  });
}

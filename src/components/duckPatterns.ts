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

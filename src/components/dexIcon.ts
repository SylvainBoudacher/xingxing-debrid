// Canardex icon: a small pixel-art pokedex standing on the ground line, right
// of the parade pennant. Clicking it opens the DuckDex overlay. Same visual
// language as the shop stall / pennant (flat shapes, hover glow + bounce).

export function dexBox(h: number) {
  return { x: 158, y: h - 22 - 34, w: 26, h: 34 };
}

export function overDex(px: number, py: number, h: number): boolean {
  const b = dexBox(h);
  const pad = 8;
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad;
}

export function drawDex(
  ctx: CanvasRenderingContext2D,
  now: number,
  hover: boolean,
  h: number,
  dark: boolean,
) {
  const b = dexBox(h);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  ctx.save();
  if (hover) {
    const bob = Math.sin(now * 0.008) * 2;
    ctx.translate(cx, b.y + b.h);
    ctx.scale(1.08, 1.08);
    ctx.translate(-cx, -(b.y + b.h) - bob);

    const pulse = 0.26 + Math.sin(now * 0.008) * 0.12;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 42);
    g.addColorStop(0, `rgba(150,205,255,${pulse})`);
    g.addColorStop(1, "rgba(150,205,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 34, b.y - 34, b.w + 68, b.h + 68);
  }

  // red shell
  ctx.fillStyle = dark ? "#c0395a" : "#E0457B";
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 4);
  ctx.fill();

  // hinge band on the right edge
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(b.x + b.w - 7, b.y + 2, 5, b.h - 4);

  // lens (top-left) with white ring + glint
  ctx.fillStyle = hover ? "#8ED0FF" : "#4FB0F0";
  ctx.beginPath();
  ctx.arc(b.x + 8, b.y + 8, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(b.x + 9.5, b.y + 6.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // little status light
  ctx.fillStyle = "#FFE066";
  ctx.beginPath();
  ctx.arc(b.x + 16, b.y + 6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // screen
  ctx.fillStyle = dark ? "#e4e4ea" : "#FFF7FA";
  ctx.beginPath();
  ctx.roundRect(b.x + 4, b.y + 15, b.w - 12, 14, 2);
  ctx.fill();

  // tiny duck silhouette on the screen
  ctx.fillStyle = hover ? "#e0a712" : "#7a5c2e";
  const dx = b.x + 10;
  const dy = b.y + 23;
  ctx.beginPath();
  ctx.ellipse(dx - 0.5, dy + 0.5, 3.6, 2.5, 0, 0, Math.PI * 2); // body
  ctx.fill();
  ctx.beginPath();
  ctx.arc(dx + 2.5, dy - 2, 2, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(dx + 4.2, dy - 2); // beak
  ctx.lineTo(dx + 6.5, dy - 1.6);
  ctx.lineTo(dx + 4.2, dy - 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

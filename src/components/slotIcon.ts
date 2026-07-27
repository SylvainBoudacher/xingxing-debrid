// Bandit manchot: une petite machine à sous en pixel-art posée au sol, à droite
// du Canardex. Un clic ouvre l'overlay du casino. Même langage visuel que le
// Canardex et le stand (formes plates, halo + rebond au survol), avec en plus
// un état éteint tant que le cooldown de 10h n'est pas écoulé.

export function slotBox(h: number) {
  return { x: 208, y: h - 22 - 36, w: 28, h: 36 };
}

export function overSlot(px: number, py: number, h: number): boolean {
  const b = slotBox(h);
  const pad = 8;
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad;
}

export function drawSlot(
  ctx: CanvasRenderingContext2D,
  now: number,
  hover: boolean,
  h: number,
  dark: boolean,
  ready: boolean,
) {
  const b = slotBox(h);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  // clignotement de l'enseigne quand un tirage est disponible
  const blink = ready ? 0.6 + Math.sin(now * 0.006) * 0.4 : 0;

  ctx.save();
  if (hover) {
    const bob = Math.sin(now * 0.008) * 2;
    ctx.translate(cx, b.y + b.h);
    ctx.scale(1.08, 1.08);
    ctx.translate(-cx, -(b.y + b.h) - bob);
  }

  if (ready) {
    const pulse = 0.2 + blink * 0.22;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 44);
    g.addColorStop(0, `rgba(255,90,140,${pulse})`);
    g.addColorStop(1, "rgba(255,90,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 36, b.y - 36, b.w + 72, b.h + 72);
  }

  // corps de la borne
  ctx.fillStyle = ready ? (dark ? "#9E2038" : "#C0284A") : dark ? "#4A3038" : "#6B4A54";
  ctx.beginPath();
  ctx.roundRect(b.x, b.y + 6, b.w, b.h - 6, 4);
  ctx.fill();

  // fronton arrondi
  ctx.fillStyle = ready ? "#E8B93C" : dark ? "#5A4A3A" : "#8A7462";
  ctx.beginPath();
  ctx.roundRect(b.x + 2, b.y, b.w - 4, 11, 5);
  ctx.fill();

  // enseigne 777 sur le fronton
  ctx.fillStyle = ready ? `rgba(255,255,255,${0.55 + blink * 0.45})` : "rgba(255,255,255,0.28)";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(b.x + 7 + i * 5, b.y + 3, 3, 1.4);
    ctx.fillRect(b.x + 8.6 + i * 5, b.y + 4.4, 1.4, 3.6);
  }

  // les trois rouleaux
  ctx.fillStyle = dark ? "#1C1C22" : "#2A2A32";
  ctx.beginPath();
  ctx.roundRect(b.x + 3, b.y + 14, b.w - 10, 12, 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const rx = b.x + 5 + i * 5.6;
    ctx.fillStyle = dark ? "#E6E6EC" : "#FFF7FA";
    ctx.fillRect(rx, b.y + 16, 4, 8);
    ctx.fillStyle = ready ? ["#FF3B7B", "#41E8FF", "#FFD24D"][i] : "#9A9AA6";
    ctx.fillRect(
      rx + 0.8,
      b.y + 18 + (ready ? (Math.sin(now * 0.004 + i) + 1) * 1.4 : 1.4),
      2.4,
      2,
    );
  }

  // fente à jetons
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(b.x + 6, b.y + 29, 10, 2);

  // levier: boule rouge sur tige, sur le flanc droit
  const pull = hover ? Math.sin(now * 0.008) * 2 : 0;
  ctx.strokeStyle = dark ? "#8A8A94" : "#B0B0BC";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(b.x + b.w - 1, b.y + 22);
  ctx.lineTo(b.x + b.w + 4, b.y + 14 + pull);
  ctx.stroke();
  ctx.fillStyle = ready ? "#F0584E" : "#7A5A5A";
  ctx.beginPath();
  ctx.arc(b.x + b.w + 4, b.y + 12 + pull, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

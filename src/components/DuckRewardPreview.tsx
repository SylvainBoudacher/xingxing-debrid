import { useEffect, useRef } from "react";
import type { DuckReward } from "@/lib/duckRewards";
import { makeDuckSprite } from "./duckSprite";
import {
  createChameleonSkinner,
  drawChameleonHalo,
  drawGodlyAura,
  drawGodlyBolts,
  drawNovaAura,
  drawNovaOrbit,
  drawPeacockFan,
  drawPhoenixEmbers,
  drawPhoenixWings,
} from "./duckRewardEffects";

// Vignette animée d'une récompense obtenue: le sprite plus son effet, avec les
// mêmes routines que la piscine. Le canard est dessiné plus petit que la boîte
// et calé vers le bas, pour laisser la place aux ailes et à la roue au-dessus.
export function DuckRewardPreview({ reward, size = 52 }: { reward: DuckReward; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const variant = reward.variant();
    const sprite = makeDuckSprite(variant);
    const skin = createChameleonSkinner();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = size * 1.7;
    canvas.width = Math.floor(box * dpr);
    canvas.height = Math.floor(box * dpr);
    canvas.style.width = `${box}px`;
    canvas.style.height = `${box}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    // le halo, les rayons et les éclairs rayonnent tout autour du canard: plutôt
    // que de rapetisser le canard pour les faire tenir, on resserre l'effet
    // autour de lui (la roue du paon et les ailes du phénix, elles, ne débordent
    // que vers le haut et tiennent déjà).
    const radial = variant.effect === "nova" || variant.effect === "godly";
    const dh = size * 0.9;
    const dw = dh * (sprite.width / sprite.height);
    const cx = box / 2;
    const cy = box * (radial ? 0.5 : 0.64);
    const ew = dw * (radial ? 0.62 : 1);
    const eh = dh * (radial ? 0.62 : 1);

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = now - start;
      const frame = { ctx, cx, cy, dw: ew, dh: eh, t, phase: 0 };
      ctx.clearRect(0, 0, box, box);
      if (variant.effect === "chameleon") drawChameleonHalo(frame);
      else if (variant.effect === "peacock") drawPeacockFan(frame);
      else if (variant.effect === "phoenix") drawPhoenixWings(frame);
      else if (variant.effect === "nova") drawNovaAura(frame);
      else if (variant.effect === "godly") drawGodlyAura(frame);
      const img = variant.effect === "chameleon" ? skin(sprite, dw, dh, t, 0) : sprite;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      if (variant.effect === "phoenix") drawPhoenixEmbers(frame);
      else if (variant.effect === "nova") drawNovaOrbit(frame);
      else if (variant.effect === "godly") drawGodlyBolts(frame);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reward, size]);

  return <canvas ref={ref} className="shrink-0" />;
}

import { useEffect, useRef } from "react";
import type { DuckReward } from "@/lib/duckRewards";
import { makeDuckSprite } from "./duckSprite";
import {
  createChameleonSkinner,
  drawBirthdayFireworks,
  drawChameleonHalo,
  drawCroupierChips,
  drawCroupierNeon,
  drawCroupierSign,
  drawGodlyAura,
  drawGodlyBolts,
  drawHatConfetti,
  drawNovaAura,
  drawNovaOrbit,
  drawPeacockFan,
  drawPhoenixEmbers,
  drawPhoenixWings,
} from "./duckRewardEffects";
import { rewardPreviewLayout } from "./duckRewardLayout";

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

    const layout = rewardPreviewLayout(size, sprite.width / sprite.height, variant.effect);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = layout.box;
    canvas.width = Math.floor(box * dpr);
    canvas.height = Math.floor(box * dpr);
    canvas.style.width = `${box}px`;
    canvas.style.height = `${box}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const { cx, cy, dw, dh, ew, eh } = layout;

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
      else if (variant.effect === "croupier") drawCroupierNeon(frame);
      const img = variant.effect === "chameleon" ? skin(sprite, dw, dh, t, 0) : sprite;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      if (variant.effect === "phoenix") drawPhoenixEmbers(frame);
      else if (variant.effect === "nova") drawNovaOrbit(frame);
      else if (variant.effect === "godly") drawGodlyBolts(frame);
      else if (variant.effect === "croupier") {
        drawCroupierChips(frame);
        drawCroupierSign(frame);
      } else if (variant.effect === "birthday") {
        drawHatConfetti(frame);
        drawBirthdayFireworks(frame);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reward, size]);

  return <canvas ref={ref} className="shrink-0" />;
}

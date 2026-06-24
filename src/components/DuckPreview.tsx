import { useEffect, useRef } from "react";
import { makeDuckSprite, SH, SW } from "./duckSprite";
import type { Variant } from "./duckTypes";

// Renders a single duck skin to a canvas, reusing the exact sprite drawing the
// pool uses. Used for the shop preview and the collection thumbnails.
export function DuckPreview({ variant, size = 96 }: { variant: Variant; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = size;
    const w = size * (SW / SH);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(makeDuckSprite(variant), 0, 0, w, h);
  }, [variant, size]);

  return <canvas ref={ref} className="shrink-0" />;
}

import { useReducedMotion } from "motion/react";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { emit, isIdle, newBurst, stepBurst, type Burst, type BurstKind } from "./burst";

export interface BurstHandle {
  fire(kind: BurstKind, clientX: number, clientY: number): void;
}

const RAY_COUNT = 12;

function draw(g: CanvasRenderingContext2D, b: Burst, t: number) {
  const { width: w, height: h } = g.canvas;
  const len = Math.hypot(w, h);
  g.clearRect(0, 0, w, h);
  for (const r of b.rays) {
    g.save();
    g.translate(r.x, r.y);
    g.rotate(t * 0.6);
    g.globalAlpha = Math.min(1, (r.life / r.max) * 2) * 0.3;
    g.fillStyle = r.color;
    for (let i = 0; i < RAY_COUNT; i++) {
      g.rotate((Math.PI * 2) / RAY_COUNT);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-len * 0.08, -len);
      g.lineTo(len * 0.08, -len);
      g.fill();
    }
    g.restore();
  }
  for (const p of b.parts) {
    g.save();
    g.globalAlpha = Math.min(1, (p.life / p.max) * 2);
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.fillStyle = p.color;
    if (p.star) {
      g.fillRect(-p.size / 2, -1, p.size, 2);
      g.fillRect(-1, -p.size / 2, 2, p.size);
    } else g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    g.restore();
  }
  if (b.flash > 0) {
    g.globalAlpha = b.flash * 0.75;
    g.fillStyle = "#fff4c8";
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }
}

// Canvas posé sur toute la scène ; la boucle ne tourne que tant qu'il reste à dessiner.
export function BurstLayer({ ref }: { ref: Ref<BurstHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const burst = useRef(newBurst());
  const raf = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useImperativeHandle(
    ref,
    () => ({
      fire(kind, clientX, clientY) {
        const cv = canvas.current;
        if (!cv) return;
        if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) {
          cv.width = cv.clientWidth;
          cv.height = cv.clientHeight;
        }
        const box = cv.getBoundingClientRect();
        emit(burst.current, kind, clientX - box.left, clientY - box.top, Math.random, !!reduced);
        if (raf.current) return;
        let last = performance.now();
        const frame = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          stepBurst(burst.current, dt);
          draw(cv.getContext("2d")!, burst.current, now / 1000);
          raf.current = isIdle(burst.current) ? 0 : requestAnimationFrame(frame);
        };
        raf.current = requestAnimationFrame(frame);
      },
    }),
    [reduced],
  );

  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 -z-10 size-full" />;
}

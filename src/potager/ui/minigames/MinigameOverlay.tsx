import { useEffect, useRef, useState } from "react";
import type { MinigameResult } from "../../core/minigames/types";
import type { Grade, Point } from "../../core/types";
import { PANEL_STYLE } from "../hdPanel";
import { GradeBanner } from "./GradeBanner";
import { HINTS } from "./minigameHints";
import { MinigameHint } from "./MinigameHint";
import { KEY_INPUT, type ActiveGame } from "./minigameKit";
import { LH, LW } from "./pixelKit";

const GRADE_SHOWN_MS = 600;
const MARGIN = 8;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function MinigameOverlay({
  active,
  project,
  onDone,
}: {
  active: ActiveGame;
  project: (p: Point) => { x: number; y: number };
  onDone: (r: MinigameResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<{ game: ActiveGame; grade: Grade } | null>(null);
  const grade = shown?.game === active ? shown.grade : null;

  useEffect(() => {
    const { game, draw, gesture } = active;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    let raf = 0,
      last = performance.now(),
      doneAt = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      game.update(Math.min(0.05, (now - last) / 1000));
      last = now;
      draw(c, game.view());
      const r = game.result();
      if (r) {
        if (!doneAt) {
          doneAt = now;
          setShown({ game: active, grade: r.grade });
        }
        if (now - doneAt > GRADE_SHOWN_MS) {
          cancelAnimationFrame(raf);
          onDone(r);
        }
      }
      // au-dessus de la cible, sans sortir de la fenêtre
      const el = boxRef.current;
      if (el) {
        const at = project(active.anchor);
        const w = el.offsetWidth,
          h = el.offsetHeight;
        const x = clamp(at.x - w / 2, MARGIN, innerWidth - w - MARGIN),
          y = clamp(at.y - h * 1.15, MARGIN, innerHeight - h - MARGIN);
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const input = KEY_INPUT[e.code];
      if (!input || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (e.repeat) return;
      game.press(input, e.type === "keydown");
    };
    // souris : maintenir = action ; au puits, moitié gauche ou droite de l'écran
    const pointerInput = (e: PointerEvent) =>
      gesture === "puits" ? (e.clientX < innerWidth / 2 ? "left" : "right") : "action";
    let held: ReturnType<typeof pointerInput> | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      held = pointerInput(e);
      game.press(held, true);
    };
    const onUp = () => {
      if (held) game.press(held, false);
      held = null;
    };
    addEventListener("keydown", onKey);
    addEventListener("keyup", onKey);
    addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey);
      removeEventListener("keyup", onKey);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
    };
  }, [active, project, onDone]);

  const hint = HINTS[active.gesture];
  return (
    <div ref={boxRef} className="pointer-events-none fixed top-0 left-0 z-20">
      <div
        className="w-[338px] px-1.5 pt-1 pb-2"
        style={{ ...PANEL_STYLE, boxShadow: "0 4px 14px rgba(0,0,0,0.6)" }}
      >
        <div className="px-1 pb-1 text-xl leading-tight font-bold text-[#f5d27a] italic">
          {hint.title}
        </div>
        <div className="relative border border-[#5a4426]">
          <canvas
            ref={canvasRef}
            width={LW}
            height={LH}
            className="block h-[180px] w-[320px]"
            style={{ imageRendering: "pixelated" }}
          />
          {grade && <GradeBanner grade={grade} />}
        </div>
        <MinigameHint hint={hint} />
      </div>
    </div>
  );
}

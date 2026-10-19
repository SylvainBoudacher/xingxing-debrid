import { useEffect, useRef } from "react";
import type { MinigameResult } from "../../core/minigames/types";
import type { Point } from "../../core/types";
import { drawGrade, MH, MW } from "./drawMinigames";
import { KEY_INPUT, type ActiveGame } from "./minigameKit";

const GRADE_SHOWN_MS = 600;

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

  useEffect(() => {
    const { game, draw, gesture } = active;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
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
        drawGrade(c, r.grade);
        doneAt ||= now;
        if (now - doneAt > GRADE_SHOWN_MS) {
          cancelAnimationFrame(raf);
          onDone(r);
        }
      }
      const at = project(active.anchor);
      if (boxRef.current)
        boxRef.current.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -115%)`;
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

  return (
    <div ref={boxRef} className="pointer-events-none fixed left-0 top-0 z-20">
      <div
        className="border-2 border-[#b8975a] p-1"
        style={{ background: "rgba(20,14,10,0.85)", boxShadow: "0 4px 12px rgba(0,0,0,0.6)" }}
      >
        <canvas
          ref={canvasRef}
          width={MW}
          height={MH}
          className="block h-[162px] w-[288px]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

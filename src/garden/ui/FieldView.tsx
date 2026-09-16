import { useCallback, useEffect, useRef, useState, type Dispatch, type PointerEvent } from "react";
import { toast } from "sonner";
import type { Effect, Tool } from "../core/actions";
import { planAction } from "../core/actions";
import { withDemoPlants } from "../core/demo";
import { planMove } from "../core/move";
import { HOUR } from "../core/time";
import { isMovable } from "../core/tiles";
import type { GardenSave, TileKey } from "../core/types";
import { isRaining } from "../core/weather";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import type { PickResult } from "../render/picking";
import type { GardenAction } from "./gardenReducer";
import { GardenDevBar } from "./GardenDevBar";
import { describeTarget, toneOf } from "./hover";
import { SidePanel } from "./SidePanel";
import { TileTooltip } from "./TileTooltip";
import { ToolBar } from "./ToolBar";
import { useCrows } from "./useCrows";

const DRAG_PX = 6;
const FLASH_MS = 1600;

interface Pointer {
  x: number;
  y: number;
  pick: PickResult | null;
}

export function FieldView({
  save,
  now,
  dispatch,
}: {
  save: GardenSave;
  now: number;
  dispatch: Dispatch<GardenAction>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const saveRef = useRef<GardenSave | null>(save);
  const down = useRef<Pointer | null>(null);
  const drag = useRef<{ from: TileKey; to: TileKey | null; reason: string | null } | null>(null);
  const [tool, setTool] = useState<Tool>("main");
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Pointer | null>(null);
  const [flash, setFlash] = useState<{ x: number; y: number; text: string } | null>(null);
  const { spawn } = useCrows(sceneRef, saveRef);

  useEffect(() => {
    const scene = createGardenScene(canvasRef.current!, "garden");
    sceneRef.current = scene;
    scene.start();
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    saveRef.current = save;
    sceneRef.current?.sync(save, now);
  }, [save, now]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(id);
  }, [flash]);

  // vue dérivée à chaque rendu : suit la sauvegarde, l'outil et l'heure
  const view = hover?.pick && !dragging ? describeTarget(save, hover.pick.target, tool, now) : null;
  const shown = view && !(view.info.kind === "grass" && !view.plan) ? view : null;

  useEffect(() => {
    const interaction = sceneRef.current?.interaction;
    if (!interaction || dragging) return;
    interaction.setHighlight(
      shown ? (hover?.pick?.ground?.key ?? null) : null,
      shown ? toneOf(shown) : undefined,
    );
  }, [shown, hover, dragging]);

  const local = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const runEffects = useCallback((effects: Effect[]) => {
    const interaction = sceneRef.current?.interaction;
    for (const fx of effects) {
      if (fx.kind === "burst") interaction?.burst(fx.key, fx.particle);
      else if (fx.kind === "chase") interaction?.chaseCrow(fx.id);
      else toast(fx.text);
    }
  }, []);

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    if (!interaction) return;
    const at = local(e);
    const start = down.current;
    const startKey = start?.pick?.target.kind === "tile" ? start.pick.target.key : null;
    if (
      start &&
      !drag.current &&
      tool === "main" &&
      startKey &&
      isMovable(save.tiles[startKey]) &&
      Math.hypot(at.x - start.x, at.y - start.y) > DRAG_PX
    ) {
      drag.current = { from: startKey, to: null, reason: null };
      interaction.lift(startKey);
      setDragging(true);
      setHover(null);
    }
    if (drag.current) {
      const pick = interaction.pickAt(e.clientX, e.clientY, drag.current.from);
      if (!pick?.ground) return;
      interaction.moveLifted(pick.ground.x, pick.ground.z);
      const result = planMove(save, drag.current.from, pick.ground.key);
      drag.current.to = pick.ground.key;
      drag.current.reason = result.ok ? null : result.reason;
      interaction.setHighlight(pick.ground.key, result.ok ? "ok" : "no");
      return;
    }
    setHover({ ...at, pick: interaction.pickAt(e.clientX, e.clientY) });
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    if (!interaction || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = { ...local(e), pick: interaction.pickAt(e.clientX, e.clientY) };
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    const start = down.current;
    down.current = null;
    if (!interaction) return;
    if (drag.current) {
      const { from, to, reason } = drag.current;
      drag.current = null;
      setDragging(false);
      interaction.drop();
      interaction.setHighlight(null);
      if (to && to !== from) {
        if (reason) setFlash({ ...local(e), text: reason });
        else dispatch({ type: "move", from, to });
      }
      return;
    }
    if (!start?.pick) return;
    const plan = planAction(save, start.pick.target, tool, Date.now());
    if (!plan?.ok) return;
    const out = plan.apply();
    dispatch({ type: "set", save: out.save });
    runEffects(out.effects);
  }

  function onPointerLeave() {
    if (drag.current) return;
    setHover(null);
  }

  const cursor = shown?.plan?.ok ? "pointer" : shown?.movable ? "grab" : "default";

  return (
    <div className="relative flex-1 select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ cursor: dragging ? "grabbing" : cursor }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
      <SidePanel save={save} raining={isRaining(now)} />
      {shown && hover && <TileTooltip x={hover.x} y={hover.y} view={shown} />}
      {flash && (
        <div
          className="pointer-events-none absolute translate-x-3.5 translate-y-3.5 rounded-lg border border-amber-300/35 bg-[#1a1216]/90 px-2.5 py-1 text-xs text-[#d98a7a]"
          style={{ left: flash.x, top: flash.y }}
        >
          {flash.text}
        </div>
      )}
      <ToolBar tool={tool} onSelect={setTool} />
      {import.meta.env.DEV && (
        <GardenDevBar
          onSeed={() => dispatch({ type: "set", save: withDemoPlants(save, Date.now()) })}
          onLeaves={() => {
            const t = Date.now();
            dispatch({ type: "set", save: { ...save, leaves: { checkedAt: t - 12 * HOUR } } });
            dispatch({ type: "tick", now: t });
          }}
          onCrow={spawn}
        />
      )}
    </div>
  );
}

import { planAction, type Plan, type Target, type Tool } from "../core/actions";
import { describeCrow, describeTile, type TileInfo } from "../core/target";
import { isMovable } from "../core/tiles";
import type { GardenSave } from "../core/types";
import type { HighlightTone } from "../render/highlight";

export interface HoverView {
  info: TileInfo;
  plan: Plan | null;
  movable: boolean;
}

export function describeTarget(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
): HoverView {
  const plan = planAction(save, target, tool, now);
  if (target.kind === "crow") return { info: describeCrow(), plan, movable: false };
  return {
    info: describeTile(save, target.key, now),
    plan,
    movable: tool === "main" && isMovable(save.tiles[target.key]),
  };
}

export const toneOf = (view: HoverView): HighlightTone =>
  !view.plan ? "info" : view.plan.ok ? "ok" : "no";

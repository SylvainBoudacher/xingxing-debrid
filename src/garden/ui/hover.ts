import { planAction, type Plan, type Target, type Tool } from "../core/actions";
import { describeCrow, describeTile, type TileInfo } from "../core/target";
import { isMovable } from "../core/tiles";
import type { DecorId, GardenSave, Rarity } from "../core/types";
import type { HighlightTone } from "../render/highlight";

export interface HoverView {
  info: TileInfo;
  plan: Plan | null;
  movable: boolean;
}

export interface HoverOptions {
  seedRarity?: Rarity | null;
  decor?: DecorId | null;
}

export function describeTarget(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
  opts: HoverOptions = {},
): HoverView {
  const { seedRarity = null, decor = null } = opts;
  const plan = planAction(save, target, tool, now, { seedRarity, decor });
  if (target.kind === "crow") return { info: describeCrow(), plan, movable: false };
  return {
    info: describeTile(save, target.key, now, { seedRarity }),
    plan,
    movable: tool === "main" && isMovable(save.tiles[target.key]),
  };
}

export const toneOf = (view: HoverView): HighlightTone =>
  !view.plan ? "info" : view.plan.ok ? "ok" : "no";

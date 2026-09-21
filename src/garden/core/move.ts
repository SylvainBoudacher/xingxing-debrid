import { isInField, isSoil } from "./plots";
import { isMovable, setTile } from "./tiles";
import type { GardenSave, TileKey } from "./types";

export type MoveResult = { ok: true; save: GardenSave } | { ok: false; reason: string };

export function planMove(save: GardenSave, from: TileKey, to: TileKey): MoveResult {
  const tile = save.tiles[from];
  if (!tile || !isMovable(tile)) return { ok: false, reason: "rien à déplacer ici" };
  if (from === to) return { ok: true, save };
  if (!isInField(save.plots, to)) return { ok: false, reason: "hors du champ" };
  if (save.tiles[to]) return { ok: false, reason: "la case est occupée" };
  if (tile.kind === "plant" && !isSoil(save.plots, to))
    return { ok: false, reason: "une plante ne va que sur de la terre" };
  return { ok: true, save: setTile(setTile(save, from, undefined), to, tile) };
}

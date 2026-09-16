import type { GardenSave, TileContent, TileKey } from "./types";

export function setTile(save: GardenSave, key: TileKey, tile: TileContent | undefined): GardenSave {
  const tiles = { ...save.tiles };
  if (tile) tiles[key] = tile;
  else delete tiles[key];
  return { ...save, tiles };
}

export const isMovable = (tile: TileContent | undefined): boolean =>
  tile?.kind === "plant" || tile?.kind === "decor";

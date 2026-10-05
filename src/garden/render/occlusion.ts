import { parseTileKey, type TileKey } from "../core/types";

// Rangées devant une case (plus près de la caméra) qui peuvent la masquer : un sprite fait
// 1,5 case de haut, il couvre au plus les deux rangées derrière lui.
const DEPTH = 2;

export function hidingTiles(target: TileKey, keys: TileKey[]): TileKey[] {
  const [tx, ty] = parseTileKey(target);
  return keys.filter((key) => {
    const [x, y] = parseTileKey(key);
    return x === tx && y > ty && y <= ty + DEPTH;
  });
}

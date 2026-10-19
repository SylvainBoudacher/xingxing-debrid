import type { Gesture, Target } from "../../core/actions";
import { MAP } from "../../core/catalog/map";
import { parcelCells } from "../../core/cells";
import { createArroser } from "../../core/minigames/arroser";
import { createBecher } from "../../core/minigames/becher";
import { createCueillir } from "../../core/minigames/cueillir";
import { createPuits } from "../../core/minigames/puits";
import { createSemer } from "../../core/minigames/semer";
import type { Input, Minigame } from "../../core/minigames/types";
import type { Point } from "../../core/types";
import { drawArroser, drawBecher, drawCueillir, drawPuits, drawSemer } from "./drawMinigames";

export type GameGesture = Exclude<Gesture, "abri">;

export interface ActiveGame {
  gesture: GameGesture;
  target: Target;
  anchor: Point;
  // vue et dessin vont de pair : le type exact de la vue reste propre à chaque jeu
  game: Minigame<unknown>;
  draw: (c: CanvasRenderingContext2D, view: unknown) => void;
}

const as = <V>(game: Minigame<V>, draw: (c: CanvasRenderingContext2D, v: V) => void) => ({
  game: game as Minigame<unknown>,
  draw: draw as (c: CanvasRenderingContext2D, v: unknown) => void,
});

export function createGame(gesture: GameGesture) {
  switch (gesture) {
    case "becher":
      return as(createBecher(), drawBecher);
    case "semer":
      return as(createSemer(Math.random), drawSemer);
    case "arroser":
      return as(createArroser(), drawArroser);
    case "cueillir":
      return as(createCueillir(Math.random), drawCueillir);
    case "puits":
      return as(createPuits(), drawPuits);
  }
}

export function anchorOf(t: Target): Point {
  if (t.kind === "abri") return { x: MAP.abri.x, z: MAP.abri.z };
  if (t.kind === "puits") return { x: MAP.puits.x, z: MAP.puits.z };
  const c = MAP.parcels.flatMap((p) => parcelCells(p.id)).find((x) => x.key === t.key);
  return c ? c.center : { ...MAP.spawn };
}

// touches physiques : Espace, flèches, ZQSD (AZERTY)
export const KEY_INPUT: Record<string, Input> = {
  Space: "action",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

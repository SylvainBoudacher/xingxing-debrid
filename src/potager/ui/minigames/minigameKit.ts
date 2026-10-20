import type { Gesture, Target } from "../../core/actions";
import { MAP, parcelSign } from "../../core/catalog/map";
import { parcelCells } from "../../core/cells";
import { createArroser } from "../../core/minigames/arroser";
import { createBecher } from "../../core/minigames/becher";
import { createCueillir } from "../../core/minigames/cueillir";
import { createDesherber } from "../../core/minigames/desherber";
import { createPuits } from "../../core/minigames/puits";
import { createRuban } from "../../core/minigames/ruban";
import { createSemer } from "../../core/minigames/semer";
import type { Input, Minigame, MinigameResult } from "../../core/minigames/types";
import type { Point } from "../../core/types";
import {
  drawArroser,
  drawBecher,
  drawCueillir,
  drawDesherber,
  drawPuits,
  drawSemer,
} from "./drawMinigames";
import { drawRuban } from "./drawRuban";

export type GameGesture = Exclude<Gesture, "abri" | "ramasser" | "etal" | "cabane" | "panneau">;

export interface ActiveGame {
  gesture: GameGesture;
  target: Target;
  anchor: Point;
  // case du sac en main au lancement : changer de main pendant le jeu ne change rien
  hand: number;
  // direction de l'avatar au lancement : sens des outils de niveau 2
  dir: Point;
  // présent : reçoit le résultat à la place de l'action du jardin
  onDone?: (r: MinigameResult) => void;
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
    case "desherber":
      return as(createDesherber(), drawDesherber);
    case "servir":
      return as(createRuban(Math.random), drawRuban);
  }
}

export function anchorOf(t: Target): Point {
  if (t.kind === "abri") return { x: MAP.abri.x, z: MAP.abri.z };
  if (t.kind === "puits") return { x: MAP.puits.x, z: MAP.puits.z };
  if (t.kind === "foret") return MAP.forest[t.spot];
  if (t.kind === "etal" || t.kind === "cabane") return MAP.buildings.find((b) => b.id === t.kind)!;
  if (t.kind === "panneau") return parcelSign(t.parcel);
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

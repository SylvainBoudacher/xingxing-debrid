import type { Effect } from "./duckTypes";

// Géométrie d'une vignette de récompense du Canardex. Séparée du composant
// parce que c'est le seul endroit où l'on peut vérifier, sans canvas, que les
// effets tiennent dans la case.

export interface RewardLayout {
  box: number; // côté du canvas
  cx: number;
  cy: number;
  dw: number; // taille du sprite
  dh: number;
  ew: number; // taille passée aux routines d'effet
  eh: number;
}

// Le halo, les rayons et les éclairs rayonnent tout autour du canard: plutôt
// que de rapetisser le canard pour les faire tenir, on resserre l'effet autour
// de lui. La roue du paon et les ailes du phénix, elles, ne débordent que vers
// le haut, d'où le canard calé plus bas.
export function isRadialEffect(effect?: Effect): boolean {
  return effect === "nova" || effect === "godly";
}

export function rewardPreviewLayout(
  size: number,
  spriteRatio: number,
  effect?: Effect,
): RewardLayout {
  const radial = isRadialEffect(effect);
  const box = size * 1.7;
  const dh = size * 0.9;
  const dw = dh * spriteRatio;
  const shrink = radial ? 0.62 : 1;
  return {
    box,
    cx: box / 2,
    cy: box * (radial ? 0.5 : 0.64),
    dw,
    dh,
    ew: dw * shrink,
    eh: dh * shrink,
  };
}

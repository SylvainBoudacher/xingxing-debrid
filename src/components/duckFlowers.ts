import type { Effect, Variant } from "./duckTypes";

// Les trois canards fleurs: des mythiques à recette fixe, tirés aussi souvent
// que le Roi (voir randomVariant). Leur effet sert de signature d'espèce.

export const margueriteVariant = (): Variant => ({
  body: "#FBF7EC",
  beak: "#F5811F",
  acc: "daisy",
  effect: "daisy",
});

export const tournesolVariant = (): Variant => ({
  body: "#F7B928",
  beak: "#F5811F",
  acc: "sunflower",
  pattern: "seeds",
  effect: "sunflower",
});

export const cactusVariant = (): Variant => ({
  body: "#5FA34A",
  beak: "#F5811F",
  acc: "cactusflower",
  pattern: "cactus",
  effect: "cactus",
});

export const FLOWER_VARIANTS = [margueriteVariant, tournesolVariant, cactusVariant];

// Leur shiny n'est pas le filtre irisé commun: chacun a sa propre variante de
// fleur (pâquerette rose, tournesol de lune, reine de la nuit). v.body ne
// change pas, le Canardex continue de les ranger sous leur couleur unique.
const SHINY_BODY: Partial<Record<Effect, string>> = {
  daisy: "#FBD2E0",
  sunflower: "#C8643A",
  cactus: "#6FA3B8",
};

export const isFlowerDuck = (v: Variant) => !!v.effect && v.effect in SHINY_BODY;

export function flowerBody(v: Variant): string {
  return (v.shiny && v.effect && SHINY_BODY[v.effect]) || v.body;
}

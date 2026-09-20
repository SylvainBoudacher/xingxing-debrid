// Pity du Potager, sans aucun lien avec src/game/pity.ts (le jeu des canards).
// Les jauges sont stockées en nombre de graines sèches, jamais en pourcentage :
// la règle affichée et la règle appliquée sont la même.
export interface Gauge {
  base: number;
  step: number;
  cap: number;
}

export const GAUGES = {
  discovery: { base: 0.25, step: 0.02, cap: 0.75 },
  rare: { base: 0.25, step: 0.02, cap: 0.7 },
} as const satisfies Record<string, Gauge>;

export const maxDry = (g: Gauge): number => Math.ceil((g.cap - g.base) / g.step);

export const chanceOf = (g: Gauge, dry: number): number =>
  Math.min(g.base + g.step * Math.max(0, dry), g.cap);

export const advance = (g: Gauge, dry: number): number => Math.min(dry + 1, maxDry(g));

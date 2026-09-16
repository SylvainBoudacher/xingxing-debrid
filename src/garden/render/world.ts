// Case (tx, ty) -> monde : une case = une unité, le champ est centré sur l'origine.
export const WORLD = { X0: -4, MIN_X: -5, MAX_X: 13, MIN_Y: -4, MAX_Y: 7 } as const;

export const wx = (tx: number): number => tx + WORLD.X0 + 0.5;
export const wz = (ty: number): number => ty - 2 + 0.5;

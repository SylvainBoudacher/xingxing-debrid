import { entryKey } from "../seeds";
import type { PotagerSave } from "../types";

// Entrées découvertes mais jamais annoncées, dont plus aucune plante non vue ne porte l'annonce :
// c'est le cas d'une fleur cueillie par un employé avant que le joueur l'ait vue.
export function orphanDiscoveries(save: PotagerSave): string[] {
  const pending = new Set(
    Object.values(save.cells).flatMap((c) =>
      c.kind === "plante" && !c.seen ? [entryKey(c.seed.species, c.seed.color)] : [],
    ),
  );
  return Object.entries(save.herbier)
    .filter(([k, e]) => !e.announced && !pending.has(k))
    .map(([k]) => k);
}

export function announceEntries(save: PotagerSave, keys: string[]): PotagerSave {
  if (!keys.length) return save;
  const herbier = { ...save.herbier };
  for (const k of keys) if (herbier[k]) herbier[k] = { ...herbier[k], announced: true };
  return { ...save, herbier };
}

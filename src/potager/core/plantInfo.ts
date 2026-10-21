import { parcelCells } from "./cells";
import { bloomEtaMs, stageOf } from "./growth";
import { weedFactor } from "./nuisances";
import type { Grade, Point, PotagerSave, Rarity } from "./types";

export const STAGE_LABEL = ["Semis", "Jeune pousse", "Tige", "Bouton", "En fleur"] as const;

export interface PlantInfo {
  center: Point;
  stage: 0 | 1 | 2 | 3 | 4;
  progress: number;
  // null : fleur épanouie, ou pousse à l'arrêt sous une corneille
  etaMs: number | null;
  rarity: Rarity;
  sowGrade: Grade;
  // temps d'humidité restant, 0 si la terre est sèche
  wetMs: number;
  tip: string;
}

// Ne dévoile que la rareté : espèce et couleur se découvrent à l'éclosion.
export function plantInfo(save: PotagerSave, key: string): PlantInfo | null {
  const c = save.cells[key];
  if (c?.kind !== "plante") return null;
  const slot = parcelCells(key.split(":")[0]).find((x) => x.key === key);
  if (!slot) return null;
  const now = save.playTimeMs;
  const stage = stageOf(c.progress);
  const crow = !!save.crows[key];
  const weed = weedFactor(save, key);
  const wetMs = Math.max(0, c.wetUntil - now);
  return {
    center: slot.center,
    stage,
    progress: c.progress,
    etaMs: stage === 4 || crow ? null : bloomEtaMs(c, now, weed),
    rarity: c.seed.rarity,
    sowGrade: c.sowGrade,
    wetMs,
    tip: tipOf(stage, crow, weed < 1, wetMs > 0),
  };
}

function tipOf(stage: number, crow: boolean, weedy: boolean, wet: boolean): string {
  if (stage === 4) return "Prête : cueille-la !";
  if (crow) return "Une corneille bloque la pousse : approche-toi.";
  if (weedy) return "Une herbe la ralentit : désherbe à côté.";
  if (!wet) return "Arrose-la pour qu'elle pousse plus vite.";
  return "Tout va bien, patience.";
}

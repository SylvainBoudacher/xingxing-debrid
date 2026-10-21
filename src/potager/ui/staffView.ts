import { MAP } from "../core/catalog/map";
import { BIEN_SHARE, WALK_SHARE } from "../core/staff/catalog";
import { MAX_LEVEL } from "../core/staff/catalog";
import type { Hired, PotagerSave, StaffGesture, StaffStatus } from "../core/types";

const WORK: Partial<Record<StaffGesture, string>> = {
  arroser: "Arrose",
  chasser: "Chasse une corneille sur",
  desherber: "Désherbe",
  becher: "Bêche",
  semer: "Sème",
  cueillir: "Cueille",
};

const WAIT: Record<Exclude<StaffStatus["kind"], "work">, string> = {
  idle: "Rien à faire",
  pause: "En pause",
  puits: "Va au puits",
  abri: "Passe à l'abri",
  etal: "Attend à l'étal",
  noSeeds: "Attend : plus de graines au coffre",
  chestFull: "Attend : coffre plein",
};

// numéro affiché d'une parcelle : son rang sur la carte, à partir de 1
export const parcelNumber = (id: string) => MAP.parcels.findIndex((p) => p.id === id) + 1;

export function statusLabel(s: StaffStatus): string {
  if (s.kind !== "work") return WAIT[s.kind];
  if (s.gesture === "servir") return "Sert un client";
  return `${WORK[s.gesture]} la parcelle ${parcelNumber(s.cell.split(":")[0])}`;
}

const pct = (n: number) => `${Math.round(n * 100)} %`;

export const levelLine = (level: Hired["level"]) =>
  `Niveau ${level} : ${pct(WALK_SHARE[level - 1])} de vitesse, ${pct(BIEN_SHARE[level - 1])} de Bien`;

export const nextLevelLine = (level: Hired["level"]) =>
  level < MAX_LEVEL ? levelLine((level + 1) as Hired["level"]) : null;

// le fleuriste n'occupe l'étal que pendant son geste : en chemin, le joueur peut encore servir
export function floristServing(save: PotagerSave): boolean {
  const w = save.crew.fleuriste;
  return w?.task?.gesture === "servir" && w.doneAt !== null;
}

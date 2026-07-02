// Achievements, persisted as an id list in the settings store and surfaced on
// the results screen when freshly unlocked.

import { type Rank, type RunState } from "./run";

export interface AchievementDef {
  id: string;
  label: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_win", label: "PREMIER TRIOMPHE - terminer la course" },
  { id: "perfect", label: "SANS UNE EGRATIGNURE - finir sans perdre un coeur" },
  { id: "rank_s", label: "CLASSE S - decrocher le rang S" },
  { id: "grazes30", label: "FROLEUR FOU - 30 frissons en un run" },
  { id: "bananas20", label: "REGIME COMPLET - 20 bananes en un run" },
  { id: "tempete_win", label: "MARIN D'EAU TROUBLE - vaincre en Tempete" },
  { id: "ouragan_win", label: "OEIL DU CYCLONE - vaincre en Ouragan" },
  { id: "endless120", label: "INSUBMERSIBLE - tenir 2 min au Typhon sans fin" },
];

// ids earned by this run (finished = the course was actually completed)
export function earnedAchievements(run: RunState, rank: Rank, finished: boolean): string[] {
  const ids: string[] = [];
  if (finished) {
    ids.push("first_win");
    if (run.hitCount === 0) ids.push("perfect");
    if (run.difficulty === "tempete") ids.push("tempete_win");
    if (run.difficulty === "ouragan") ids.push("ouragan_win");
  }
  if (rank === "S") ids.push("rank_s");
  if (run.grazes >= 30) ids.push("grazes30");
  if (run.bananas >= 20) ids.push("bananas20");
  if (run.endless && run.totalT >= 120) ids.push("endless120");
  return ids;
}

export function labelOf(id: string): string {
  return ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id;
}

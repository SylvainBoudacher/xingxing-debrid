import { familyProgress, getDex, getShinyDex, isClaimed } from "./duckDex";
import { REWARDS, rewardProgress, type DexProgress } from "./duckRewards";
import { getSlotState } from "./slotMachine";
import { SPECIES } from "@/components/duckSpecies";

// Nombre de recompenses reclamables, mis en cache pour que la boucle de rendu
// du canvas puisse le lire sans I/O. Rafraichi au montage de la pool, apres
// chaque decouverte et a chaque ouverture/claim du Canardex.
let claimable = 0;

export function claimableRewards(): number {
  return claimable;
}

export async function refreshClaimableRewards(): Promise<number> {
  const entries = await getDex();
  const shiny = await getShinyDex();
  const slots = await getSlotState();
  const progress: DexProgress = {
    species: SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length,
    shiny: shiny.length,
    ...familyProgress(entries),
    casinoJackpot: slots.jackpotWon ? 1 : 0,
  };

  const flags = await Promise.all(REWARDS.map((r) => isClaimed(r.storeKey)));
  claimable = REWARDS.filter((r, i) => {
    if (flags[i]) return false;
    const { done, total } = rewardProgress(r, progress);
    return done >= total;
  }).length;

  return claimable;
}

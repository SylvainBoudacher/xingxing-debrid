import { Button } from "@/components/ui/button";
import { rewardProgress, type DexProgress, type DuckReward } from "@/lib/duckRewards";
import { DuckPreview } from "./DuckPreview";
import { DuckRewardPreview } from "./DuckRewardPreview";

// Carte d'une récompense dans le Canardex: silhouette et compteur tant qu'elle
// est verrouillée, bouton Réclamer une fois le seuil atteint, nom une fois prise.
export function DuckRewardCard({
  reward,
  progress,
  claimed,
  onClaim,
  highlighted,
}: {
  reward: DuckReward;
  progress: DexProgress;
  claimed: boolean;
  onClaim: (reward: DuckReward) => void;
  highlighted?: boolean;
}) {
  const { done, total } = rewardProgress(reward, progress);
  const unlocked = done >= total;

  return (
    <div
      id={`reward-${reward.id}`}
      title={claimed ? reward.name : reward.lockedHint}
      className={`relative flex flex-col items-center gap-1 rounded-xl bg-white/70 dark:bg-zinc-800/60 px-2 py-3 ${highlighted ? "animate-pulse ring-2 ring-amber-400" : `ring-1 ${claimed ? "ring-yellow-300/50" : unlocked ? "ring-amber-400/70" : "ring-black/5 dark:ring-white/5"}`}`}
    >
      {claimed ? (
        <DuckRewardPreview reward={reward} size={52} />
      ) : (
        // verrouillée: silhouette figée, ni effet ni boucle d'animation
        <span className="flex h-[88px] items-center brightness-0 opacity-25 dark:invert">
          <DuckPreview variant={reward.variant()} size={47} />
        </span>
      )}
      <p className="w-full truncate text-center text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
        {claimed ? reward.name : "???"}
      </p>
      {claimed ? (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Obtenu</p>
      ) : unlocked ? (
        <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => onClaim(reward)}>
          Réclamer
        </Button>
      ) : (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {done}/{total} {reward.unit}
        </p>
      )}
    </div>
  );
}

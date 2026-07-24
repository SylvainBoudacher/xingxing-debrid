import { motion } from "motion/react";
import type { DexProgress, DuckReward } from "@/lib/duckRewards";
import { DuckRewardCard } from "./DuckRewardCard";

// Un groupe de récompenses avec son titre et sa ligne d'explication: sans elle
// on ne devine pas à quoi les compteurs correspondent.
export function DuckRewardSection({
  title,
  hint,
  rewards,
  progress,
  claimed,
  onClaim,
  delay,
}: {
  title: string;
  hint: string;
  rewards: DuckReward[];
  progress: DexProgress;
  claimed: Record<string, boolean>;
  onClaim: (reward: DuckReward) => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="mb-5 last:mb-0"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      <div className="grid grid-cols-4 gap-2">
        {rewards.map((r) => (
          <DuckRewardCard
            key={r.id}
            reward={r}
            progress={progress}
            claimed={!!claimed[r.id]}
            onClaim={onClaim}
          />
        ))}
      </div>
    </motion.div>
  );
}

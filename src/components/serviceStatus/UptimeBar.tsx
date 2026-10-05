import { motion } from "motion/react";
import type { ProbeSample } from "@/lib/serviceProbes";
import { formatClock } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

// Historique des vérifications : une barre par résultat, la plus récente à droite.
export function UptimeBar({ samples, slots = 40 }: { samples: ProbeSample[]; slots?: number }) {
  const recent = samples.slice(-slots);
  const empty = slots - recent.length;
  return (
    <div className="flex h-6 items-end gap-[2px]">
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} className="h-full flex-1 rounded-[2px] bg-black/5 dark:bg-white/6" />
      ))}
      {recent.map((s, i) => (
        <motion.span
          key={s.timestamp}
          title={`${formatClock(s.timestamp)} · ${s.success ? "OK" : "Échec"}${s.durationMs !== undefined && s.success ? ` · ${s.durationMs} ms` : ""}`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.012, ease: "easeOut" }}
          className={cn(
            "h-full flex-1 origin-bottom rounded-[2px]",
            s.success ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-red-500 hover:bg-red-600",
          )}
        />
      ))}
    </div>
  );
}

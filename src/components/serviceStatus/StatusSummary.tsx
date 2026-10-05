import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export type SummaryTone = "ok" | "down" | "checking";

const STYLES: Record<SummaryTone, { core: string; ring: string; glow: string }> = {
  ok: { core: "bg-emerald-500", ring: "border-emerald-500/40", glow: "bg-emerald-500/15" },
  down: { core: "bg-red-500", ring: "border-red-500/40", glow: "bg-red-500/15" },
  checking: { core: "bg-zinc-400", ring: "border-zinc-400/40", glow: "bg-zinc-400/10" },
};

// Orbe animé + phrase de synthèse en tête de la page de statut.
export function StatusSummary({
  tone,
  title,
  detail,
}: {
  tone: SummaryTone;
  title: string;
  detail: string;
}) {
  const s = STYLES[tone];
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-black/[0.02] p-5 ring-1 ring-black/6 dark:bg-white/[0.03] dark:ring-white/8">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <motion.span
          className={cn("absolute inset-0 rounded-full", s.glow)}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{
            duration: tone === "down" ? 1.2 : 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {[0, 1].map((i) => (
          <motion.span
            key={`${tone}-${i}`}
            className={cn("absolute inset-2 rounded-full border-2", s.ring)}
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{
              duration: tone === "down" ? 1.4 : 2.8,
              repeat: Infinity,
              delay: i * (tone === "down" ? 0.7 : 1.4),
              ease: "easeOut",
            }}
          />
        ))}
        <motion.span
          layout
          className={cn(
            "relative h-5 w-5 rounded-full shadow-lg transition-colors duration-500",
            s.core,
          )}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {detail}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

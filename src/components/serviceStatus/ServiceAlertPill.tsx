import { motion } from "motion/react";
import { ChevronRight, Loader2 } from "lucide-react";
import { StatusDot } from "./StatusDot";
import { formatClock } from "@/lib/relativeTime";

export function ServiceAlertPill({
  title,
  label,
  message,
  since,
  checking,
  onClick,
}: {
  title: string;
  label: string;
  message?: string;
  since?: number;
  checking: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group pointer-events-auto flex max-w-xs items-start gap-3 rounded-2xl bg-white/90 px-3.5 py-2.5 text-left shadow-lg ring-1 ring-red-500/25 backdrop-blur-xl dark:bg-zinc-900/90 dark:ring-red-400/30"
    >
      <StatusDot tone="down" className="mt-1" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
          {title}
          <span className="font-medium text-red-600 dark:text-red-400">· {label}</span>
          {checking && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
        </p>
        {message && (
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            {message}
          </p>
        )}
        {since && (
          <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            Depuis {formatClock(since)}
          </p>
        )}
      </div>
      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
}

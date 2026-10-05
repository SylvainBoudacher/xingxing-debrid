import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { item } from "@/components/setup/motionVariants";
import { StatusDot, type DotTone } from "./StatusDot";
import { formatAgo } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

const STATE_TEXT: Record<DotTone, string> = {
  ok: "Opérationnel",
  down: "Problème détecté",
  unknown: "Non vérifié",
};

export function ServiceStatusCard({
  name,
  description,
  tone,
  checking,
  message,
  checkedAt,
  latencyMs,
  now,
  children,
}: {
  name: string;
  description: string;
  tone: DotTone;
  checking: boolean;
  message?: string;
  checkedAt?: number;
  latencyMs?: number;
  now: number;
  children?: ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      className={cn(
        "rounded-2xl p-4 ring-1 transition-colors duration-500",
        tone === "down"
          ? "bg-red-500/[0.04] ring-red-500/25 dark:bg-red-500/[0.06] dark:ring-red-400/25"
          : "bg-white ring-black/6 dark:bg-zinc-900/60 dark:ring-white/8",
      )}
    >
      <div className="flex items-start gap-3">
        <StatusDot tone={tone} className="mt-1.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{name}</p>
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                tone === "ok" && "text-emerald-600 dark:text-emerald-400",
                tone === "down" && "text-red-600 dark:text-red-400",
                tone === "unknown" && "text-zinc-500",
              )}
            >
              {checking && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
              {STATE_TEXT[tone]}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
          {tone === "down" && message && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 text-xs leading-relaxed text-red-700 dark:text-red-300"
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
      {children && <div className="mt-4 space-y-3">{children}</div>}
      {checkedAt && (
        <p className="mt-3 flex gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>Vérifié {formatAgo(checkedAt, now)}</span>
          {latencyMs !== undefined && <span>Temps de réponse : {latencyMs} ms</span>}
        </p>
      )}
    </motion.div>
  );
}

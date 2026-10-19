import { CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";

export function StatusBadge({ code, label }: { code: number; label: string }) {
  if (code === 4) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Terminé
      </span>
    );
  }
  if (code >= 0 && code <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/12 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
        <Zap className="h-3 w-3" /> En cours
      </span>
    );
  }
  if (code >= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/12 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
        <AlertCircle className="h-3 w-3" /> Erreur
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-300/60 dark:bg-zinc-700/50 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}

import { Loader2, RefreshCw } from "lucide-react";

export function RefreshButton({
  checking,
  onRefresh,
}: {
  checking: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={checking}
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-black/8 transition-colors hover:text-zinc-900 disabled:opacity-70 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
    >
      {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      {checking ? "Vérification..." : "Actualiser"}
    </button>
  );
}

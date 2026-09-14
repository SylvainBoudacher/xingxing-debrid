import { Loader2, RefreshCw } from "lucide-react";

interface MangaPendingNoteProps {
  count: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function MangaPendingNote({ count, refreshing, onRefresh }: MangaPendingNoteProps) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-2.5 ring-1 ring-amber-500/20">
      <p className="flex-1 text-xs text-amber-700 dark:text-amber-400">
        {count} torrent{count > 1 ? "s" : ""} en cours de débridage chez AllDebrid.
      </p>
      <button
        disabled={refreshing}
        onClick={onRefresh}
        className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/25 disabled:opacity-40 dark:text-amber-400"
      >
        {refreshing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Vérifier
      </button>
    </div>
  );
}

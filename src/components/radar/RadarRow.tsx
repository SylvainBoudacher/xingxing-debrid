import { Button } from "@/components/ui/button";
import { expectationLabel, libraryLabel, rowSummary } from "@/lib/radar/labels";
import type { RadarEntry, ContentKey } from "@/lib/radar/types";
import { baselineLabel, entryStatus } from "@/lib/radar/view";
import { Pencil, Trash2 } from "lucide-react";

interface RadarRowProps {
  entry: RadarEntry;
  owned: { certain: Set<ContentKey>; uncertain: Set<ContentKey> };
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const STATUS_RING = {
  released: "ring-emerald-500",
  partial: "ring-amber-500",
  waiting: "ring-black/10 dark:ring-white/10",
  finished: "ring-black/10 dark:ring-white/10",
};

export function RadarRow({
  entry,
  owned,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onRemove,
}: RadarRowProps) {
  const { item, season, expectation } = entry;
  const library = libraryLabel(entry, owned);
  const baseline = baselineLabel(entry);
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-white/90 p-2.5 ring-1 dark:bg-zinc-900/80 ${STATUS_RING[entryStatus(entry)]}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={`Sélectionner ${item.title}`}
        className="h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
      />
      {item.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
          alt=""
          className="h-14 w-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-14 w-10 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {item.title}
          {season !== null && `, saison ${season}`}
        </p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{rowSummary(entry)}</p>
        <p className="truncate text-[11px] text-zinc-500">
          {[expectationLabel(expectation), baseline, library].filter(Boolean).join(" - ")}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={onView}>
        Voir
      </Button>
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label={`Modifier ${item.title}`}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onRemove} aria-label={`Retirer ${item.title}`}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

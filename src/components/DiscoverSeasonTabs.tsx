import { ChipScroller } from "@/components/ChipScroller";
import { chipClass } from "@/components/chipStyles";
import type { SeasonSelection } from "@/lib/discoverReleases";

export interface TmdbSeason {
  number: number;
  episodeCount: number;
}

interface DiscoverSeasonTabsProps {
  seasons: TmdbSeason[] | null;
  activeSeason: SeasonSelection | null;
  hasComplete: boolean;
  onChange: (season: SeasonSelection) => void;
}

// Selecteur de saisons horizontal de la fiche Decouverte.
export function DiscoverSeasonTabs({
  seasons,
  activeSeason,
  hasComplete,
  onChange,
}: DiscoverSeasonTabsProps) {
  return (
    <div className="px-5 pt-0.5 pb-3">
      <ChipScroller>
        {activeSeason !== null && hasComplete && (
          <button
            onClick={() => onChange("complete")}
            className={chipClass(activeSeason === "complete")}
          >
            Intégrale
          </button>
        )}
        {seasons === null || activeSeason === null
          ? Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-[26px] w-24 shrink-0 rounded-[9px] bg-white/70 dark:bg-zinc-800/60 animate-pulse"
              />
            ))
          : seasons.map((s) => (
              <button
                key={s.number}
                onClick={() => onChange(s.number)}
                className={chipClass(activeSeason === s.number)}
              >
                Saison {s.number}
                <span
                  className={`ml-1.5 ${
                    activeSeason === s.number
                      ? "text-zinc-400 dark:text-zinc-400"
                      : "text-zinc-400/70 dark:text-zinc-600"
                  }`}
                >
                  {s.episodeCount} ép.
                </span>
              </button>
            ))}
      </ChipScroller>
    </div>
  );
}

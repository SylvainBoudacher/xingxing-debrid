import { posterUrl } from "@/lib/posterPreload";
import { rarityOf, type RarityScale } from "@/lib/rouletteRarity";
import { CARD_W } from "@/lib/rouletteStrip";
import type { TmdbItem } from "@/lib/tmdbItem";
import { memo } from "react";

// item null : case grisee de l'etat idle, pour que le ruban ait sa hauteur
// definitive avant que les affiches n'arrivent.
export const RouletteCard = memo(function RouletteCard({
  item,
  scale,
  highlight,
}: {
  item: TmdbItem | null;
  scale: RarityScale;
  highlight: boolean;
}) {
  const color = item ? rarityOf(item.voteAverage, scale).color : "#3f3f46";
  return (
    <div
      style={{
        width: CARD_W,
        // L'anneau porte la rarete : le liseré du bas seul se lisait a peine.
        boxShadow: highlight
          ? `inset 0 0 0 2px ${color}, 0 0 34px 8px ${color}90`
          : `inset 0 0 0 2px ${color}${item ? "80" : "40"}`,
      }}
      className="relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-zinc-200 transition-shadow duration-500 dark:bg-zinc-900"
    >
      {item?.posterPath && (
        <img
          src={posterUrl(item.posterPath, "w185")}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}

      {item && (
        <>
          <div
            style={{ backgroundImage: `linear-gradient(to top, ${color}b3, transparent 58%)` }}
            className="pointer-events-none absolute inset-0"
          />
          {/* Fond noir plutot que la couleur : l'or et le rose ne portent pas
              de texte blanc lisible. */}
          {item.voteAverage > 0 && (
            <span
              style={{ color }}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/70 px-1.5 py-px text-[10px] font-bold tabular-nums"
            >
              {item.voteAverage.toFixed(1)}
            </span>
          )}
        </>
      )}
    </div>
  );
});

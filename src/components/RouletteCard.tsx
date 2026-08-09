import { posterUrl } from "@/lib/posterPreload";
import { RARITY_STYLE, rarityOf } from "@/lib/rouletteRarity";
import { CARD_W } from "@/lib/rouletteStrip";
import type { TmdbItem } from "@/lib/tmdbItem";
import { memo } from "react";

// item null : case grisee de l'etat idle, pour que le ruban ait sa hauteur
// definitive avant le premier lancer.
export const RouletteCard = memo(function RouletteCard({
  item,
  highlight,
}: {
  item: TmdbItem | null;
  highlight: boolean;
}) {
  const color = item ? RARITY_STYLE[rarityOf(item.voteAverage)].color : "#3f3f46";
  return (
    <div
      style={{
        width: CARD_W,
        borderBottomColor: color,
        backgroundImage: `linear-gradient(to top, ${color}40, transparent 65%)`,
        boxShadow: highlight ? `0 0 30px 6px ${color}80` : undefined,
      }}
      className="relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg border-b-[3px] bg-zinc-200 ring-1 ring-black/10 transition-shadow duration-500 dark:bg-zinc-900 dark:ring-white/10"
    >
      {item?.posterPath && (
        <img
          src={posterUrl(item.posterPath, "w185")}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
});

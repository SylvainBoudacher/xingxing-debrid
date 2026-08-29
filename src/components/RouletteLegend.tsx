import { rarityTiers, type RarityScale } from "@/lib/rouletteRarity";

// Sans elle, les couleurs du ruban ne veulent rien dire. Les bornes sont
// affichees : c'est la note TMDB qui fixe la couleur, pas le hasard.
export function RouletteLegend({ scale }: { scale: RarityScale }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {rarityTiers(scale).map(({ rarity, label, bound, color }) => (
        <span
          key={rarity}
          className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          <span
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}90` }}
            className="h-1.5 w-1.5 rounded-full"
          />
          {label}
          <span className="text-zinc-400 dark:text-zinc-600">{bound}</span>
        </span>
      ))}
    </div>
  );
}

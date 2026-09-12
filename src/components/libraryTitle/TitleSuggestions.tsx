import { DiscoverPosterCard } from "@/components/DiscoverPosterCard";
import { useEdgeFade } from "@/lib/useEdgeFade";
import type { TmdbItem } from "@/lib/tmdbItem";
import { motion } from "motion/react";

interface TitleSuggestionsProps {
  heading: string;
  items: TmdbItem[];
  // Clés « mediaType-id » déjà présentes en bibliothèque / aimées.
  ownedKeys: Set<string>;
  likedKeys: Set<string>;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
  className?: string;
}

// Rangée défilante de titres liés à la fiche, en bas de page. Ouvre la fiche de
// releases C411 du titre choisi.
export function TitleSuggestions({
  heading,
  items,
  ownedKeys,
  likedKeys,
  onOpen,
  onToggleLike,
  className,
}: TitleSuggestionsProps) {
  const { ref, fadeStyle } = useEdgeFade<HTMLDivElement>();

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{heading}</h2>
      {/* Déborde des marges de la fiche : la rangée file jusqu'aux bords. Le
          rembourrage vertical laisse respirer le survol (lever + ombre) sans
          être rogné ; les marges négatives l'annulent dans la mise en page. */}
      <div
        ref={ref}
        style={fadeStyle}
        className="-mx-6 -mb-6 -mt-3 flex gap-4 overflow-x-auto px-6 pb-8 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const key = `${item.mediaType}-${item.id}`;
          return (
            <div key={key} className="w-32 flex-none">
              <DiscoverPosterCard
                item={item}
                index={i}
                liked={likedKeys.has(key)}
                inLibrary={ownedKeys.has(key)}
                subtitle={item.year}
                onOpen={onOpen}
                onToggleLike={onToggleLike}
              />
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

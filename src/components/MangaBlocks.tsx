import type { MangaBlock } from "@/lib/mangaSections";
import type { MangaEntry } from "@/lib/mangaLibrary";
import { LayoutGroup, motion } from "motion/react";
import type { ReactNode } from "react";

interface MangaBlocksProps {
  blocks: MangaBlock[];
  /** Rend la grille ou la liste d'un bloc : la mise en page reste à l'appelant. */
  children: (items: MangaEntry[]) => ReactNode;
  /** Actions du bloc (renommer, supprimer...), à droite de son titre. */
  blockMenu?: (block: MangaBlock) => ReactNode;
}

// Rend les blocs de catégories. LayoutGroup relie les blocs : une oeuvre qui
// change de catégorie glisse jusqu'à sa nouvelle place.
export function MangaBlocks({ blocks, children, blockMenu }: MangaBlocksProps) {
  return (
    <LayoutGroup>
      <div className="space-y-8">
        {blocks.map((block) => (
          <motion.div
            layout="position"
            key={block.key}
            className={
              block.label
                ? "rounded-2xl bg-black/[0.02] p-3 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10"
                : undefined
            }
          >
            {block.label && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {block.label}
                </span>
                <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                  {block.count}
                </span>
                <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
                {blockMenu?.(block)}
              </div>
            )}
            {block.count === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Aucun titre dans cette catégorie
              </p>
            ) : (
              children(block.items)
            )}
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}

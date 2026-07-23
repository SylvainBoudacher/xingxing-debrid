import type { DisplayItem } from "@/lib/library";
import type { LibraryBlock } from "@/lib/librarySections";
import { LayoutGroup, motion } from "motion/react";
import { useState, type ReactNode } from "react";

interface LibraryBlocksProps {
  blocks: LibraryBlock[];
  /** Rend la grille ou la liste d'une rangée : la mise en page reste à l'appelant. */
  children: (items: DisplayItem[]) => ReactNode;
  /** Actions du bloc (renommer, supprimer...), à droite de son titre. */
  blockMenu?: (block: LibraryBlock) => ReactNode;
  /** Dépôt d'un titre sur un bloc : reçoit le dropId du bloc survolé. */
  onDropOnBlock?: (dropId: string) => void;
}

// Rend les blocs (Films / Séries, ou catégories) et leurs rangées.
//
// LayoutGroup relie toutes les rangées : une carte qui change de section garde
// son identité (layoutId) et glisse jusqu'à sa nouvelle place au lieu de
// disparaître / réapparaître. `layout="position"` sur les conteneurs déplace
// les titres sans étirer leur contenu.
export function LibraryBlocks({ blocks, children, blockMenu, onDropOnBlock }: LibraryBlocksProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <LayoutGroup>
      <div className="space-y-8">
        {blocks.map((block) => {
          const droppable = onDropOnBlock !== undefined && block.dropId !== undefined;
          const active = droppable && hovered === block.dropId;
          return (
            <motion.div
              layout="position"
              key={block.key}
              onDragOver={droppable ? (e) => e.preventDefault() : undefined}
              onDragEnter={droppable ? () => setHovered(block.dropId!) : undefined}
              onDragLeave={
                droppable
                  ? (e) => {
                      // Ignore les passages d'un enfant à l'autre du même bloc.
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                        setHovered(null);
                    }
                  : undefined
              }
              onDrop={
                droppable
                  ? (e) => {
                      e.preventDefault();
                      setHovered(null);
                      onDropOnBlock!(block.dropId!);
                    }
                  : undefined
              }
              className={
                droppable
                  ? `rounded-2xl p-3 ring-1 transition-colors ${
                      active
                        ? "bg-indigo-500/10 ring-indigo-500"
                        : "bg-black/[0.02] ring-black/5 dark:bg-white/[0.03] dark:ring-white/10"
                    }`
                  : undefined
              }
            >
              {block.label && (
                <BlockHeader label={block.label} count={block.count} menu={blockMenu?.(block)} />
              )}
              <div className="space-y-5">
                {block.sections.map((section) => (
                  <motion.div layout="position" key={section.key}>
                    {section.label && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {section.label}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                          {section.items.length}
                        </span>
                      </div>
                    )}
                    {children(section.items)}
                  </motion.div>
                ))}
                {droppable && block.count === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    Glissez des titres ici
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function BlockHeader({ label, count, menu }: { label: string; count: number; menu?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
        {count}
      </span>
      <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
      {menu}
    </div>
  );
}

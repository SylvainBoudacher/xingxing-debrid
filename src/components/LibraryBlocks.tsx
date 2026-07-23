import type { DisplayItem } from "@/lib/library";
import type { LibraryBlock } from "@/lib/librarySections";
import type { ReactNode } from "react";

interface LibraryBlocksProps {
  blocks: LibraryBlock[];
  /** Rend la grille ou la liste d'une rangée : la mise en page reste à l'appelant. */
  children: (items: DisplayItem[]) => ReactNode;
}

// Rend les blocs (Films / Séries) et leurs rangées (genres). Les titres nuls
// sont omis : en mode "sans regroupement" il ne reste que les cartes.
export function LibraryBlocks({ blocks, children }: LibraryBlocksProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.key}>
          {block.label && <BlockHeader label={block.label} count={block.count} />}
          <div className="space-y-5">
            {block.sections.map((section) => (
              <div key={section.key}>
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
        {count}
      </span>
      <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
    </div>
  );
}

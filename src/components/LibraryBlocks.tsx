import type { DisplayItem } from "@/lib/library";
import type { LibraryBlock } from "@/lib/librarySections";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { ReactNode } from "react";

interface LibraryBlocksProps {
  blocks: LibraryBlock[];
  /** Rend la grille ou la liste d'une rangée : la mise en page reste à l'appelant. */
  children: (items: DisplayItem[]) => ReactNode;
  /** Actions du bloc (renommer, supprimer...), à droite de son titre. */
  blockMenu?: (block: LibraryBlock) => ReactNode;
  /** Bloc actuellement survolé par un titre en cours de glissement. */
  activeDropId?: string | null;
  /** Clés des blocs repliés : leur contenu est masqué, le titre reste cliquable. */
  collapsedKeys?: Set<string>;
  /** Plie / déplie un bloc. Sans ce callback, les titres ne sont pas cliquables. */
  onToggleCollapsed?: (key: string) => void;
}

// Rend les blocs (Films / Séries, ou catégories) et leurs rangées.
//
// LayoutGroup relie toutes les rangées : une carte qui change de section garde
// son identité (layoutId) et glisse jusqu'à sa nouvelle place au lieu de
// disparaître / réapparaître. `layout="position"` sur les conteneurs déplace
// les titres sans étirer leur contenu.
export function LibraryBlocks({
  blocks,
  children,
  blockMenu,
  activeDropId,
  collapsedKeys,
  onToggleCollapsed,
}: LibraryBlocksProps) {
  return (
    <LayoutGroup>
      <div className="space-y-8">
        {blocks.map((block) => {
          const droppable = block.dropId !== undefined;
          const active = droppable && activeDropId === block.dropId;
          // Un bloc sans titre (mode « Aucun ») n'a rien sur quoi cliquer.
          const collapsible = block.label !== null && onToggleCollapsed !== undefined;
          const collapsed = collapsible && (collapsedKeys?.has(block.key) ?? false);
          return (
            <motion.div
              layout="position"
              key={block.key}
              data-drop-id={block.dropId}
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
                <BlockHeader
                  label={block.label}
                  count={block.count}
                  menu={blockMenu?.(block)}
                  collapsed={collapsed}
                  onToggle={collapsible ? () => onToggleCollapsed(block.key) : undefined}
                />
              )}
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
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
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function BlockHeader({
  label,
  count,
  menu,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  menu?: ReactNode;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const title = (
    <>
      {onToggle && (
        <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
        </motion.span>
      )}
      <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white">
        {label}
      </span>
      <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
        {count}
      </span>
    </>
  );

  return (
    <div className="mb-3 flex items-center gap-2">
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="group flex items-center gap-2"
        >
          {title}
        </button>
      ) : (
        title
      )}
      <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
      {menu}
    </div>
  );
}

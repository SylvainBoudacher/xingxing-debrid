import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UNCLASSIFIED, type LibraryCategory } from "@/lib/mangaCategories";
import { motion } from "motion/react";
import { FolderInput, Plus, X } from "lucide-react";

interface MangaSelectionBarProps {
  count: number;
  categories: LibraryCategory[];
  /** Range la sélection dans une catégorie (UNCLASSIFIED pour l'en sortir). */
  onClassify: (categoryId: string) => void;
  onCreateCategoryWithSelection: () => void;
  onCancel: () => void;
}

export function MangaSelectionBar({
  count,
  categories,
  onClassify,
  onCreateCategoryWithSelection,
  onCancel,
}: MangaSelectionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 p-1.5 pl-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90">
        <span className="mr-1 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={count === 0}
              className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FolderInput className="h-3.5 w-3.5" />
              Classer dans
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {categories.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => onClassify(c.id)}>
                {c.name}
              </DropdownMenuItem>
            ))}
            {categories.length > 0 && (
              <DropdownMenuItem onClick={() => onClassify(UNCLASSIFIED)}>
                Non classés
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onCreateCategoryWithSelection}>
              <Plus className="h-4 w-4" />
              Nouvelle catégorie...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onCancel}
          title="Quitter la sélection"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

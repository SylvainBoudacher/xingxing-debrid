import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface LibraryCategoryMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

// Actions d'un bloc catégorie, à droite de son titre.
export function LibraryCategoryMenu({
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: LibraryCategoryMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Gérer la catégorie"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="h-4 w-4" />
          Renommer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
          <ChevronLeft className="h-4 w-4" />
          Monter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
          <ChevronRight className="h-4 w-4" />
          Descendre
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Supprimer la catégorie
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

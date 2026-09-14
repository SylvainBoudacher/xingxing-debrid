import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PenLine, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

interface MangaTitleMenuProps {
  // Barre du haut opaque : sinon le bouton se détache du bandeau.
  solid: boolean;
  onRetag: () => void;
  onRemove: () => void;
}

// Actions rares de la fiche. Le retrait demande une seconde validation, menu
// ouvert.
export function MangaTitleMenu({ solid, onRetag, onRemove }: MangaTitleMenuProps) {
  const [confirm, setConfirm] = useState(false);

  return (
    <DropdownMenu onOpenChange={(open) => !open && setConfirm(false)}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Réglages"
          title="Réglages"
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-colors ${
            solid
              ? "text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
              : "bg-black/35 text-white backdrop-blur-md hover:bg-black/50"
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRetag}>
          <PenLine className="h-4 w-4" />
          Corriger la fiche MangaDex
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            if (confirm) return onRemove();
            e.preventDefault();
            setConfirm(true);
          }}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          {confirm ? "Confirmer le retrait" : "Retirer de la bibliothèque"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, FolderCog, ListChecks, Pencil, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

interface TitleMoreMenuProps {
  // Barre du haut opaque : sinon le bouton se détache du bandeau.
  solid: boolean;
  onSelectEpisodes?: () => void;
  onOrganize?: () => void;
  onChangeTmdb?: () => void;
  // Séries seulement : l'action vit ici au lieu de la barre du héros.
  onToggleWatched?: () => void;
  watched?: boolean;
  onDelete: () => void;
}

// Actions rares de la fiche. La suppression demande une seconde validation,
// menu ouvert.
export function TitleMoreMenu({
  solid,
  onSelectEpisodes,
  onOrganize,
  onChangeTmdb,
  onToggleWatched,
  watched,
  onDelete,
}: TitleMoreMenuProps) {
  const [confirm, setConfirm] = useState(false);
  const hasActions = !!(onToggleWatched || onSelectEpisodes || onOrganize || onChangeTmdb);

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
        {onToggleWatched && (
          <DropdownMenuItem onClick={onToggleWatched}>
            <Check className="h-4 w-4" strokeWidth={watched ? 3 : 2} />
            {watched ? "Marquer comme non vu" : "Marquer comme vu"}
          </DropdownMenuItem>
        )}
        {onSelectEpisodes && (
          <DropdownMenuItem onClick={onSelectEpisodes}>
            <ListChecks className="h-4 w-4" />
            Choisir des épisodes
          </DropdownMenuItem>
        )}
        {onOrganize && (
          <DropdownMenuItem onClick={onOrganize}>
            <FolderCog className="h-4 w-4" />
            Gérer les dossiers
          </DropdownMenuItem>
        )}
        {onChangeTmdb && (
          <DropdownMenuItem onClick={onChangeTmdb}>
            <Pencil className="h-4 w-4" />
            Changer les informations TMDB
          </DropdownMenuItem>
        )}
        {hasActions && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onSelect={(e) => {
            if (confirm) return onDelete();
            e.preventDefault();
            setConfirm(true);
          }}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          {confirm ? "Confirmer la suppression" : "Supprimer de la bibliothèque"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

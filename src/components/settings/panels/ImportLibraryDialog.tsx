import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LibraryEntry } from "@/lib/library";
import type { LibraryPayload } from "@/lib/librarySync/format";
import type { MergeResult } from "@/lib/librarySync/merge";

export interface ImportPreview {
  payload: LibraryPayload;
  preview: MergeResult;
  localCount: number;
}

// Fenetre de confirmation : annonce ce qui va se passer et laisse l'utilisateur
// arbitrer les titres absents du fichier avant d'appliquer quoi que ce soit.
export function ImportLibraryDialog({
  data,
  onCancel,
  onMerge,
  onReplace,
}: {
  data: ImportPreview | null;
  onCancel: () => void;
  onMerge: (toRemove: Set<string>) => void;
  onReplace: () => void;
}) {
  const [kept, setKept] = useState<Set<string>>(new Set());

  if (!data) return null;
  const { preview, payload, localCount } = data;

  function toggle(hash: string) {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  }

  function handleMerge() {
    const toRemove = new Set(preview.missing.map((e) => e.infoHash).filter((h) => !kept.has(h)));
    setKept(new Set());
    onMerge(toRemove);
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Importer la bibliothèque</AlertDialogTitle>
          <AlertDialogDescription>
            Fichier exporté le {new Date(payload.exportedAt).toLocaleString("fr-FR")}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 text-sm">
          <ul className="space-y-1 text-neutral-600 dark:text-neutral-300">
            <li>{preview.added} nouveaux titres</li>
            <li>{preview.updated} mis à jour</li>
            <li>{preview.unchanged} inchangés</li>
          </ul>

          {preview.missing.length > 0 && (
            <MissingList entries={preview.missing} kept={kept} onToggle={toggle} />
          )}

          <p className="text-xs text-neutral-500">
            Écraser remplace vos {localCount} titres par les {payload.entries.length} du fichier.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <button
            onClick={onReplace}
            className="rounded-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors"
          >
            Écraser
          </button>
          <AlertDialogAction onClick={handleMerge}>Fusionner</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Titres presents en local mais absents du fichier alors qu'ils existaient a
// l'export : coches par defaut, l'hypothese la plus probable etant qu'ils ont
// ete supprimes sur l'autre machine.
function MissingList({
  entries,
  kept,
  onToggle,
}: {
  entries: LibraryEntry[];
  kept: Set<string>;
  onToggle: (hash: string) => void;
}) {
  return (
    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3 space-y-2">
      <p className="text-xs font-medium">
        {entries.length} titre{entries.length > 1 ? "s" : ""} absent
        {entries.length > 1 ? "s" : ""} du fichier
      </p>
      <p className="text-xs text-neutral-500">
        Ils existaient lors de l'export : probablement supprimés sur l'autre machine. Décochez ceux
        que vous voulez garder.
      </p>
      <ul className="max-h-40 overflow-y-auto space-y-1">
        {entries.map((entry) => (
          <li key={entry.infoHash}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={!kept.has(entry.infoHash)}
                onChange={() => onToggle(entry.infoHash)}
              />
              <span className="truncate">{entry.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

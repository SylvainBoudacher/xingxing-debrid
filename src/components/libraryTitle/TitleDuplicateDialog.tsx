import { ReleaseTagBadges } from "@/components/ReleaseTagBadges";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatSize } from "@/lib/debrid";
import { filesToDrop, type ReleaseChoice } from "@/lib/libraryDuplicates";
import type { TitleItem } from "@/lib/libraryTitle";
import { CopyX } from "lucide-react";
import { useState } from "react";

interface TitleDuplicateDialogProps {
  open: boolean;
  groups: TitleItem[][];
  releases: ReleaseChoice[];
  onConfirm: (keepHash: string) => void;
  onCancel: () => void;
}

// Choix de la release à conserver quand plusieurs couvrent les mêmes épisodes.
// Le nettoyage porte sur tout le titre : une intégrale importée deux fois se
// règle en une fois, sans repasser saison par saison.
export function TitleDuplicateDialog({
  open,
  groups,
  releases,
  onConfirm,
  onCancel,
}: TitleDuplicateDialogProps) {
  const [keep, setKeep] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Réarme le choix par défaut (la release la plus fournie) à chaque ouverture.
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setKeep(null);
  }

  const chosen = keep ?? releases[0]?.entry.infoHash ?? null;

  const plan = chosen ? filesToDrop(groups, chosen) : null;
  const dropped = plan?.links.size ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      {open && (
        <AlertDialogContent className="max-w-2xl gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex flex-col items-center px-7 pb-5 pt-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
              <CopyX className="h-5 w-5" />
            </span>
            <AlertDialogTitle className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {groups.length} épisode{groups.length > 1 ? "s" : ""} en double
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Choisissez la release à conserver. Les copies des autres sont retirées de la
              bibliothèque, tout le titre confondu.
            </AlertDialogDescription>
          </div>

          {/* py-1 : sans lui, l'overflow rogne l'anneau de la carte sélectionnée. */}
          <div className="max-h-[22rem] space-y-2 overflow-y-auto px-5 py-1 pb-4">
            {releases.map((r) => {
              const active = r.entry.infoHash === chosen;
              const perEpisode = r.count > 0 ? r.size / r.count : 0;
              return (
                <button
                  key={r.entry.infoHash}
                  onClick={() => setKeep(r.entry.infoHash)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                    active
                      ? "bg-indigo-500/10 ring-2 ring-indigo-500"
                      : "bg-black/[0.03] ring-1 ring-black/5 hover:bg-black/[0.06] dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full ring-2 ${
                      active ? "bg-indigo-600 ring-indigo-600" : "ring-zinc-300 dark:ring-zinc-600"
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-all font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
                      {r.label}
                    </span>
                    <ReleaseTagBadges tags={r.tags} className="mt-2" />
                    <span className="mt-2 block text-[11px] text-zinc-500 dark:text-zinc-400">
                      {r.count} épisode{r.count > 1 ? "s" : ""} concerné
                      {r.count > 1 ? "s" : ""} - {formatSize(r.size)} ({formatSize(perEpisode)} par
                      épisode)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="flex-1 pl-2 text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
              {plan && plan.size > 0
                ? `Espace libéré dans la bibliothèque : ${formatSize(plan.size)}`
                : "Aucun fichier à retirer pour ce choix"}
            </span>
            <AlertDialogCancel className="h-10 flex-none rounded-xl px-5 border-0 bg-black/5 text-sm font-medium text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15">
              Annuler
            </AlertDialogCancel>
            <button
              onClick={() => chosen && onConfirm(chosen)}
              disabled={dropped === 0}
              className="h-10 flex-none rounded-xl px-5 bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
            >
              Supprimer {dropped} fichier{dropped > 1 ? "s" : ""}
            </button>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}

import vlcLogo from "@/assets/vlc.png";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PendingBulk } from "@/lib/useDebridActions";
import { Copy, Download } from "lucide-react";
import { useEffect } from "react";

const WORDING: Record<
  PendingBulk["action"],
  { title: string; note: string; verb: string; icon: React.ReactNode }
> = {
  download: {
    title: "Télécharger toute la sélection",
    note: "Les fichiers sont débridés puis téléchargés les uns après les autres.",
    verb: "Télécharger",
    icon: <Download className="h-5 w-5" />,
  },
  vlc: {
    title: "Ouvrir toute la sélection dans VLC",
    note: "Une playlist unique est envoyée à VLC, dans l'ordre des épisodes.",
    verb: "Ouvrir dans VLC",
    icon: <img src={vlcLogo} className="h-5 w-5" alt="" />,
  },
  copy: {
    title: "Partager toute la sélection",
    note: "Les liens débridés sont copiés dans le presse-papiers, un par ligne.",
    verb: "Partager",
    icon: <Copy className="h-5 w-5" />,
  },
};

// Garde-fou des actions groupées : au-delà du seuil, on annonce le nombre de
// fichiers avant de lancer quoi que ce soit.
export function BulkConfirmDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingBulk | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Le composant reste monté et c'est `open` qui pilote la fermeture : démonter
  // la racine Radix d'un coup la prive de son nettoyage. Ouverte depuis un menu
  // Radix, elle peut en plus laisser le verrou de pointeur posé sur le body
  // quand les deux overlays se ferment coup sur coup.
  useEffect(() => {
    if (pending) return;
    const timer = setTimeout(() => {
      if (document.body.style.pointerEvents === "none") document.body.style.pointerEvents = "";
    }, 300);
    return () => clearTimeout(timer);
  }, [pending]);

  const wording = pending ? WORDING[pending.action] : null;

  return (
    <AlertDialog open={!!pending} onOpenChange={(next) => !next && onCancel()}>
      {pending && (
        <AlertDialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex flex-col items-center px-7 pb-6 pt-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-600 ring-1 ring-indigo-500/20 dark:text-indigo-300">
              {wording?.icon}
            </span>
            <AlertDialogTitle className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {wording?.title}
            </AlertDialogTitle>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {pending.count}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              fichiers
            </p>
            <AlertDialogDescription className="mt-4 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {wording?.note}
            </AlertDialogDescription>
          </div>

          <div className="flex gap-2 border-t border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <AlertDialogCancel className="h-10 flex-1 rounded-xl border-0 bg-black/5 text-sm font-medium text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15">
              Annuler
            </AlertDialogCancel>
            <button
              onClick={onConfirm}
              autoFocus
              className="h-10 flex-1 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              {wording?.verb}
            </button>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}

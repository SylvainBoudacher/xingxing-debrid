import { applyMangaMoves, type PlannedMove } from "@/lib/mangaMove";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MangaMoveDialogProps {
  moves: PlannedMove[];
  targetDir: string;
  onClose: () => void;
}

/**
 * Propose de deplacer les tomes deja telecharges vers le nouveau dossier
 * manga. En cas d'echec, liste les fichiers restes en place pour que
 * l'utilisateur les deplace lui-meme.
 */
export function MangaMoveDialog({ moves, targetDir, onClose }: MangaMoveDialogProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<PlannedMove[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function move() {
    setBusy(true);
    try {
      const result = await applyMangaMoves(moves);
      if (result.failed.length === 0) {
        toast.success(`${result.moved} tome(s) déplacé(s).`);
        onClose();
        return;
      }
      toast.error(`${result.failed.length} fichier(s) n'ont pas pu être déplacés.`);
      setFailed(result.failed);
    } catch {
      // Echec I/O reel : on ne sait pas quels fichiers ont bouge, on les
      // considere tous comme non deplaces par securite
      toast.error("Le déplacement a échoué.");
      setFailed(moves);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        {failed === null ? (
          <>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Déplacer les mangas déjà téléchargés ?
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {moves.length} tome(s) sont enregistrés dans l&apos;ancien dossier. Ils peuvent être
              déplacés vers {targetDir}, rangés par série.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-full px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Laisser sur place
              </button>
              <button
                onClick={move}
                disabled={busy}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {busy ? "Déplacement..." : "Déplacer"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {failed.length} fichier(s) à déplacer manuellement
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ces fichiers n&apos;ont pas pu être déplacés vers {targetDir}. Ils restent lisibles
              depuis leur emplacement actuel.
            </p>
            <ul className="mt-3 space-y-1">
              {failed.slice(0, 5).map((m) => (
                <li key={m.from} className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                  {m.from}
                </li>
              ))}
            </ul>
            {failed.length > 5 && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                et {failed.length - 5} autre(s).
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

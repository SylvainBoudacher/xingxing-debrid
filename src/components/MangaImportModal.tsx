import { MangaImportSearch } from "@/components/MangaImportSearch";
import { MangaImportVolumes } from "@/components/MangaImportVolumes";
import { importLocalVolumes, type PlannedImport } from "@/lib/mangaImport";
import type { MangaItem } from "@/lib/mangaItem";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MangaImportModalProps {
  /** Fichiers deja choisis dans le selecteur, avec leur numero devine. */
  planned: PlannedImport[];
  knownIds: Set<string>;
  /** Appele apres un import reussi, avec l'oeuvre a ouvrir. */
  onImported: (mangaId: string) => void;
  onClose: () => void;
}

/**
 * Import de .cbz venus de l'extérieur : l'utilisateur identifie l'oeuvre dans
 * MangaDex, confirme le numero de chaque fichier, et les tomes rejoignent le
 * dossier de la serie ainsi que l'entree de bibliotheque (creee si besoin).
 */
export function MangaImportModal({
  planned: initial,
  knownIds,
  onImported,
  onClose,
}: MangaImportModalProps) {
  const [item, setItem] = useState<MangaItem | null>(null);
  const [planned, setPlanned] = useState(initial);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setNumber(path: string, number: number | null) {
    setPlanned((prev) => prev.map((p) => (p.path === path ? { ...p, number } : p)));
  }

  async function confirm() {
    if (!item || importing) return;
    setImporting(true);
    try {
      const { imported, failed } = await importLocalVolumes(item, planned);
      if (imported === 0) {
        toast.error("Aucun fichier n'a pu être importé.");
        return;
      }
      toast.success(
        failed === 0
          ? `${imported} tome${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""} dans « ${item.title} »`
          : `${imported} tome(s) importé(s), ${failed} en échec`,
      );
      onImported(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import impossible");
    } finally {
      setImporting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
      >
        <div className="flex items-center gap-3 border-b border-black/5 p-4 dark:border-white/5">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {item ? "Numéroter les tomes" : "À quelle œuvre appartiennent ces fichiers ?"}
            </h2>
            <p className="truncate text-xs text-zinc-500">
              {planned.length} fichier{planned.length > 1 ? "s" : ""} .cbz
              {item && ` · ${item.title}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {item ? (
          <MangaImportVolumes
            item={item}
            planned={planned}
            importing={importing}
            onNumber={setNumber}
            onBack={() => setItem(null)}
            onConfirm={() => void confirm()}
          />
        ) : (
          <MangaImportSearch knownIds={knownIds} onPick={setItem} />
        )}
      </motion.div>
    </motion.div>
  );
}

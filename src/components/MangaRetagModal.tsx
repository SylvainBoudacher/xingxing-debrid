import { MangaImportSearch } from "@/components/MangaImportSearch";
import type { MangaItem } from "@/lib/mangaItem";
import type { MangaEntry } from "@/lib/mangaLibrary";
import { retagManga } from "@/lib/mangaRetag";
import { Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MangaRetagModalProps {
  entry: MangaEntry;
  knownIds: Set<string>;
  /** Appele apres correction, avec l'id de l'oeuvre a rouvrir. */
  onRetagged: (mangaId: string) => void;
  onClose: () => void;
}

/**
 * Correction de fiche : l'utilisateur choisit la bonne oeuvre MangaDex. Les
 * tomes suivent, ainsi que leurs fichiers, deplaces dans le dossier du
 * nouveau titre.
 */
export function MangaRetagModal({ entry, knownIds, onRetagged, onClose }: MangaRetagModalProps) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pick(item: MangaItem) {
    if (saving) return;
    setSaving(true);
    try {
      const merging = item.id !== entry.mangaId && knownIds.has(item.id);
      await retagManga(entry.mangaId, item);
      toast.success(
        merging ? `Tomes fusionnés dans « ${item.title} »` : `Fiche corrigée : « ${item.title} »`,
      );
      onRetagged(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Correction impossible");
    } finally {
      setSaving(false);
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
              Corriger la fiche de « {entry.meta.title} »
            </h2>
            <p className="text-xs text-zinc-500">
              {entry.volumes.length} tome{entry.volumes.length > 1 ? "s" : ""} suivront la nouvelle
              fiche, fichiers compris.
            </p>
          </div>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <MangaImportSearch
          knownIds={knownIds}
          initialQuery={entry.meta.title}
          onPick={(item) => void pick(item)}
        />
      </motion.div>
    </motion.div>
  );
}

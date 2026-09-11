import { SelectionBox } from "@/components/libraryParts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Copy, Download, Loader2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface TitleSelectionBarProps {
  count: number;
  allSelected: boolean;
  // Téléchargement ou copie de la sélection en cours.
  busy: boolean;
  copying: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCopy: () => void;
}

// Barre flottante du mode sélection, posée en bas de la fiche.
export function TitleSelectionBar({
  count,
  allSelected,
  busy,
  copying,
  onToggleAll,
  onCancel,
  onDelete,
  onDownload,
  onCopy,
}: TitleSelectionBarProps) {
  const [confirm, setConfirm] = useState(false);
  const empty = count === 0;

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  function handleDelete() {
    if (!confirm) return setConfirm(true);
    setConfirm(false);
    onDelete();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 p-2 pl-3 shadow-xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/90 dark:ring-white/10">
        <button
          onClick={onToggleAll}
          disabled={busy}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-300 dark:hover:text-white"
        >
          <SelectionBox checked={allSelected} />
          Tout sélectionner
        </button>
        <span className="px-2 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex h-8 flex-none items-center rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          Annuler
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDelete}
          disabled={empty || busy}
          title={confirm ? "Confirmer la suppression" : "Retirer de la bibliothèque"}
          className={`flex h-8 flex-none items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            confirm
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 hover:bg-red-500/20 dark:text-red-400"
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirm ? "Sûr ?" : "Supprimer"}
        </motion.button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={empty || busy}
              className="flex h-8 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 pl-3 pr-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Télécharger ({count})
              <ChevronDown className="h-3 w-3 text-white/70" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDownload} disabled={busy}>
              <Download className="h-4 w-4" />
              Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy} disabled={busy}>
              {copying ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copier les liens
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

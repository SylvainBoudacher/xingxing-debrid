import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface LibraryListNameModalProps {
  title: string;
  initialName?: string;
  confirmLabel: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

// Saisie du nom d'une liste (création et renommage).
export function LibraryListNameModal({
  title,
  initialName = "",
  confirmLabel,
  onConfirm,
  onClose,
}: LibraryListNameModalProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    const trimmed = name.trim();
    if (trimmed === "") return;
    onConfirm(trimmed);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nom de la liste"
          maxLength={40}
          className="mt-3 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={name.trim() === ""}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

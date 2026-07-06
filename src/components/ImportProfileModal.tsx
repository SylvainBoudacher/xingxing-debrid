import { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Loader2, Upload, X } from "lucide-react";
import { importProfile } from "@/lib/profileBackup";

function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

export function ImportProfileModal({
  path,
  onClose,
  onImported,
}: {
  path: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleImport() {
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      await importProfile(passphrase, path);
      onImported();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  }

  return (
    <motion.div
      key="import-profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/6 dark:border-white/6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/12 ring-1 ring-indigo-500/20">
              <Upload className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Importer un profil
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[200px]">
                {basename(path)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Saisissez la phrase secrète choisie lors de l'export pour déchiffrer la sauvegarde.
          </p>

          <div className="relative flex items-center">
            <KeyRound className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="password"
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImport();
              }}
              placeholder="Phrase secrète"
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/40 transition-all"
            />
          </div>

          {error && <p className="text-xs text-red-500 leading-relaxed">{error}</p>}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleImport}
            disabled={!passphrase || busy}
            className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

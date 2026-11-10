import { X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

interface RadarDialogProps {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function RadarDialog({ title, subtitle, aside, onClose, children }: RadarDialogProps) {
  // Capture : Échap ferme cette fenêtre seule, pas la fiche ou la page dessous.
  // Une liste déroulante ouverte garde la priorité.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement).closest('[role="listbox"]')) return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <motion.div
        layout
        role="dialog"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 16 }}
        className={`flex max-h-[calc(100vh-2rem)] w-full overflow-hidden bg-white/95 ring-1 ring-black/10 dark:bg-zinc-900/95 dark:ring-white/10 ${aside ? "max-w-3xl" : "max-w-md"}`}
      >
        {/* Le titre change entre la recherche et la fiche : le nouveau contenu arrive en fondu. */}
        <motion.div
          key={title}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.08, ease: "easeOut" }}
          className="flex min-w-0 flex-1"
        >
          {aside && <div className="relative hidden w-72 shrink-0 sm:block">{aside}</div>}
          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug text-zinc-900 dark:text-white">
                  {title}
                </p>
                {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

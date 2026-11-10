import { X } from "lucide-react";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl bg-white/95 ring-1 ring-black/10 dark:bg-zinc-900/95 dark:ring-white/10 ${aside ? "max-w-3xl" : "max-w-md"}`}
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
      </div>
    </div>
  );
}

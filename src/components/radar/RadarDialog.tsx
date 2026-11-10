import { X } from "lucide-react";
import type { ReactNode } from "react";

interface RadarDialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function RadarDialog({ title, onClose, children }: RadarDialogProps) {
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
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-white/95 p-5 ring-1 ring-black/10 dark:bg-zinc-900/95 dark:ring-white/10"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-zinc-900 dark:text-white">{title}</p>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

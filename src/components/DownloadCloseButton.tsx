import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

// Croix d'une carte de téléchargement avec une étiquette qui suit le curseur,
// comme "Lancer avec VLC" sur les cartes Reprendre. Le panneau est collé au
// bord droit de la fenêtre : l'étiquette s'affiche donc à gauche du curseur.
export function DownloadCloseButton({
  label,
  danger = false,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        onPointerMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onPointerLeave={() => setPos(null)}
        className={`text-muted-foreground flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors ${
          danger ? "hover:bg-red-500/15 hover:text-red-500" : "hover:bg-muted hover:text-foreground"
        }`}
        aria-label={label}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {pos &&
        createPortal(
          <div
            style={{ right: window.innerWidth - pos.x + 14, top: pos.y + 18 }}
            className="bg-popover text-popover-foreground pointer-events-none fixed z-[70] flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs shadow-md"
          >
            <X className={`h-3.5 w-3.5 ${danger ? "text-red-500" : ""}`} />
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}

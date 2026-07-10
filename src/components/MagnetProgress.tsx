import { useEffect, useState } from "react";
import { AlertCircle, Loader2, X, Zap } from "lucide-react";
import { formatSpeed } from "@/lib/debrid";
import { isMagnetError, type MagnetEntry } from "@/lib/services/allDebrid";

interface MagnetProgressProps {
  magnet: MagnetEntry;
  // Variante claire pour l'overlay des affiches (texte sur dégradé sombre).
  onPoster?: boolean;
  className?: string;
  // Annule le débridage (supprime le magnet AllDebrid et retire l'entrée).
  onCancel?: () => void;
  cancelling?: boolean;
}

// État d'un magnet encore côté AllDebrid : barre de progression pendant le
// débridage, badge d'erreur si le débridage a échoué.
export function MagnetProgress({
  magnet,
  onPoster = false,
  className = "",
  onCancel,
  cancelling = false,
}: MagnetProgressProps) {
  // Confirmation deux-clics, comme la suppression sur les cartes.
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  // span role=button : le composant vit parfois dans un <button> parent
  // (carte liste, affiche), un vrai <button> imbriqué serait invalide.
  const cancelButton = onCancel && (
    <span
      role="button"
      tabIndex={0}
      title={confirm ? "Confirmer l'annulation" : "Annuler le débridage"}
      onClick={(e) => {
        e.stopPropagation();
        if (cancelling) return;
        if (confirm) onCancel();
        else setConfirm(true);
      }}
      className={`flex h-4 flex-none cursor-pointer items-center justify-center gap-0.5 rounded transition-colors ${
        confirm
          ? "bg-red-500 px-1 text-[9px] font-semibold text-white hover:bg-red-600"
          : onPoster
            ? "w-4 text-zinc-300 hover:bg-white/20 hover:text-white"
            : "w-4 text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
      }`}
    >
      {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      {confirm && !cancelling && "Sûr ?"}
    </span>
  );

  if (isMagnetError(magnet)) {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-medium ${
          onPoster ? "text-red-300" : "text-red-600 dark:text-red-400"
        } ${className}`}
      >
        <AlertCircle className="h-3 w-3 flex-none" />
        <span className="min-w-0 flex-1 truncate">Débridage échoué · {magnet.status}</span>
        {cancelButton}
      </div>
    );
  }

  const pct =
    magnet.size > 0 ? Math.min(100, Math.round((magnet.downloaded / magnet.size) * 100)) : 0;
  const detail =
    magnet.statusCode === 0
      ? "en attente"
      : `${pct}%${magnet.downloadSpeed > 0 ? ` · ${formatSpeed(magnet.downloadSpeed)}` : ""}`;

  return (
    <div className={className}>
      <div
        className={`flex items-center justify-between gap-2 text-[10px] font-medium ${
          onPoster ? "text-indigo-200" : "text-indigo-600 dark:text-indigo-400"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1 truncate">
          <Zap className="h-3 w-3 flex-none" />
          Débridage en cours
        </span>
        <span className="flex flex-none items-center gap-1.5">
          <span className="tabular-nums">{detail}</span>
          {cancelButton}
        </span>
      </div>
      <div
        className={`mt-1 h-1 w-full overflow-hidden rounded-full ${
          onPoster ? "bg-white/25" : "bg-black/10 dark:bg-white/10"
        }`}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

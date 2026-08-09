import { Check } from "lucide-react";

interface RouletteOwnedFilterProps {
  checked: boolean;
  /** Desactive pendant le chargement et l'animation. */
  disabled: boolean;
  onToggle: () => void;
}

// Case a cocher du tirage : retire du vivier les films deja telecharges. Pas de
// persistance, le reglage vaut pour la session.
export function RouletteOwnedFilter({ checked, disabled, onToggle }: RouletteOwnedFilterProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:cursor-default disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
          checked
            ? "bg-indigo-600 ring-1 ring-indigo-500"
            : "bg-white/90 ring-1 ring-black/15 dark:bg-zinc-800/80 dark:ring-white/15"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      Exclure les films de ma bibliothèque
    </button>
  );
}

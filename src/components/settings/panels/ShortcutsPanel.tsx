import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider, SettingRow } from "../controls";
import {
  DEFAULT_NAV_SHORTCUTS,
  loadNavShortcuts,
  NAV_SHORTCUT_LABELS,
  saveNavShortcuts,
  type NavShortcutAction,
  type NavShortcuts,
} from "@/lib/shortcuts";

const ACTIONS: { action: NavShortcutAction; description: string }[] = [
  { action: "main", description: "Revenir à la page principale." },
  { action: "discover", description: "Ouvrir la page Découverte." },
  { action: "library", description: "Ouvrir votre bibliothèque." },
];

function KeyChip({ children }: { children: string }) {
  return (
    <kbd className="rounded-md bg-black/6 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 ring-1 ring-black/10 dark:ring-white/10">
      {children}
    </kbd>
  );
}

export function ShortcutsPanel() {
  const [shortcuts, setShortcuts] = useState<NavShortcuts>(DEFAULT_NAV_SHORTCUTS);
  const [recording, setRecording] = useState<NavShortcutAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNavShortcuts()
      .then(setShortcuts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(null);
        return;
      }
      const key = e.key.toLowerCase();
      if (key.length !== 1 || key === " ") return;
      const conflict = (Object.entries(shortcuts) as [NavShortcutAction, string][]).find(
        ([action, k]) => k === key && action !== recording,
      );
      if (conflict) {
        setError(
          `Espace + ${key.toUpperCase()} est déjà utilisé pour "${NAV_SHORTCUT_LABELS[conflict[0]]}".`,
        );
        setRecording(null);
        return;
      }
      const next = { ...shortcuts, [recording]: key };
      setShortcuts(next);
      setError(null);
      setRecording(null);
      saveNavShortcuts(next).catch(() => {});
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording, shortcuts]);

  async function handleReset() {
    setShortcuts(DEFAULT_NAV_SHORTCUTS);
    setError(null);
    setRecording(null);
    await saveNavShortcuts(DEFAULT_NAV_SHORTCUTS);
  }

  return (
    <SettingsPanel
      icon={Keyboard}
      title="Raccourcis clavier"
      subtitle="Naviguer entre les pages au clavier."
    >
      <FieldTitle
        title="Navigation"
        hint="Maintenez Espace puis appuyez sur la touche associée pour changer de page. Cliquez sur un raccourci pour le modifier, puis appuyez sur la nouvelle touche."
      />

      <div className="flex flex-col gap-3">
        {ACTIONS.map(({ action, description }) => (
          <SettingRow key={action} title={NAV_SHORTCUT_LABELS[action]} description={description}>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRecording(action);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                recording === action
                  ? "bg-indigo-500/10 ring-2 ring-indigo-500"
                  : "hover:bg-black/4 dark:hover:bg-white/5 ring-1 ring-transparent"
              }`}
            >
              {recording === action ? (
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Appuyez sur une touche…
                </span>
              ) : (
                <>
                  <KeyChip>Espace</KeyChip>
                  <span className="text-xs text-zinc-400">+</span>
                  <KeyChip>{shortcuts[action].toUpperCase()}</KeyChip>
                </>
              )}
            </button>
          </SettingRow>
        ))}
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

      <PanelDivider />

      <button
        type="button"
        onClick={handleReset}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        Réinitialiser les raccourcis par défaut
      </button>
    </SettingsPanel>
  );
}

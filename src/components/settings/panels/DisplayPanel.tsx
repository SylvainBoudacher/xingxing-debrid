import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { parseRelease } from "@/lib/parseRelease";
import {
  DEFAULT_VIEW_MODE_KEY,
  VIEW_MODE_KEYS,
  type ViewMode,
  type ViewModePref,
  type ViewPage,
} from "@/lib/viewMode";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider, Segmented, ViewOptionCard } from "../controls";
import { settingsStore as store } from "../store";

const EXAMPLE = "Apple.Cider.Vinegar.S01E01.MULTi.1080p.WEB.H265-CHiLL.mkv";

const PAGES: { page: ViewPage; label: string }[] = [
  { page: "search", label: "Recherche" },
  { page: "magnets", label: "Magnets" },
  { page: "library", label: "Bibliothèque" },
];

const PREF_OPTIONS: { value: ViewModePref; label: string }[] = [
  { value: "default", label: "Défaut" },
  { value: "simple", label: "Simplifiée" },
  { value: "detailed", label: "Détaillée" },
];

export function DisplayPanel() {
  const [defaultMode, setDefaultMode] = useState<ViewMode>("simple");
  const [overrides, setOverrides] = useState<Record<ViewPage, ViewModePref>>({
    search: "default",
    magnets: "default",
    library: "default",
  });
  useEffect(() => {
    store.get<ViewMode>(DEFAULT_VIEW_MODE_KEY).then((v) => {
      if (v) setDefaultMode(v);
    });
    (Object.keys(VIEW_MODE_KEYS) as ViewPage[]).forEach((page) => {
      store.get<ViewModePref>(VIEW_MODE_KEYS[page]).then((v) => {
        if (v) setOverrides((o) => ({ ...o, [page]: v }));
      });
    });
  }, []);

  async function handleDefaultChange(mode: ViewMode) {
    setDefaultMode(mode);
    await store.set(DEFAULT_VIEW_MODE_KEY, mode);
    await store.save();
  }

  async function handleOverrideChange(page: ViewPage, pref: ViewModePref) {
    setOverrides((o) => ({ ...o, [page]: pref }));
    await store.set(VIEW_MODE_KEYS[page], pref);
    await store.save();
  }

  const parsed = parseRelease(EXAMPLE);

  return (
    <SettingsPanel
      icon={Layers}
      title="Affichage des listes"
      subtitle="Comment les noms de release s'affichent partout dans l'app."
    >
      <FieldTitle
        title="Style par défaut"
        hint="S'applique à la recherche, aux magnets et à la bibliothèque, sauf exception ci-dessous."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ViewOptionCard
          label="Simplifiée"
          selected={defaultMode === "simple"}
          onClick={() => handleDefaultChange("simple")}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {parsed.quality && (
              <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                {parsed.quality}
              </span>
            )}
            {parsed.codec && (
              <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {parsed.codec}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">
            {parsed.title}
          </p>
        </ViewOptionCard>

        <ViewOptionCard
          label="Détaillée"
          selected={defaultMode === "detailed"}
          onClick={() => handleDefaultChange("detailed")}
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug break-all">
            {EXAMPLE}
          </p>
        </ViewOptionCard>
      </div>

      <PanelDivider />

      <FieldTitle
        title="Exceptions par page"
        hint="Laissez « Défaut » pour suivre le style ci-dessus, ou forcez un affichage sur une page précise."
      />

      <div className="space-y-3">
        {PAGES.map(({ page, label }) => (
          <div
            key={page}
            className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
            <Segmented
              value={overrides[page]}
              options={PREF_OPTIONS}
              onChange={(v) => handleOverrideChange(page, v)}
            />
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}

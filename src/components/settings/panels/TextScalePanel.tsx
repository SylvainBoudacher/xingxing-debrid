import { ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSystemTextScale,
  getTextScale,
  hasSystemTextScale,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  setTextScale,
  TEXT_SCALE_EVENT,
  type TextScale,
} from "@/lib/textScale";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, SettingRow, Toggle } from "../controls";
import { TickSlider } from "../TickSlider";

const MOD = navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl";

const percent = (scale: number) => `${Math.round(scale * 100)} %`;

export function TextScalePanel() {
  const [scale, setScale] = useState<TextScale>(getTextScale);
  const [systemScale, setSystemScale] = useState(1);
  const applied = scale === "system" ? systemScale : scale;
  // Valeur de la réglette pendant le glisser : le zoom n'est appliqué qu'au
  // relâchement, sinon la page se redimensionne sous le curseur.
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? applied;

  useEffect(() => {
    if (hasSystemTextScale) getSystemTextScale().then(setSystemScale);
    // Garde la réglette à jour quand la taille change au clavier.
    const onChanged = (e: Event) => setScale((e as CustomEvent<TextScale>).detail);
    window.addEventListener(TEXT_SCALE_EVENT, onChanged);
    return () => window.removeEventListener(TEXT_SCALE_EVENT, onChanged);
  }, []);

  function select(next: TextScale) {
    setScale(next);
    setTextScale(next).catch(() => {});
  }

  function commitDraft() {
    if (draft === null) return;
    setDraft(null);
    if (draft !== applied) select(draft);
  }

  const followSystem = scale === "system";

  return (
    <SettingsPanel
      icon={ZoomIn}
      title="Taille de l'interface"
      subtitle="Agrandir toute l'application pour une meilleure lisibilité."
    >
      <FieldTitle
        title="Zoom"
        hint={`Agrandit toute l'application : textes, icônes et espacements. Raccourcis : ${MOD} + et ${MOD} - pour changer de 5 %, ${MOD} 0 pour revenir à la taille par défaut.`}
      />

      {hasSystemTextScale && (
        <div className="mb-3">
          <SettingRow
            title="Suivre Windows"
            description={`Reprend Paramètres > Accessibilité > Taille du texte (actuellement ${percent(systemScale)}, limité à ${percent(MAX_SCALE)}).`}
          >
            <Toggle checked={followSystem} onChange={(v) => select(v ? "system" : systemScale)} />
          </SettingRow>
        </div>
      )}

      <div
        className={`rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-4 transition-opacity ${followSystem ? "opacity-50" : ""}`}
      >
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Niveau de zoom</p>
          <span className="text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
            {percent(shown)}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-5 items-center text-xs font-semibold text-zinc-500">A</span>
          <TickSlider
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={SCALE_STEP}
            majorEvery={5}
            value={shown}
            disabled={followSystem}
            ariaLabel="Taille de l'interface"
            formatLabel={percent}
            onChange={setDraft}
            onCommit={commitDraft}
          />
          <span className="flex h-5 items-center text-lg font-semibold text-zinc-500">A</span>
        </div>

        {/* La page est déjà zoomée de `applied` : on compense pour montrer la taille finale. */}
        <p
          className="mt-4 truncate text-zinc-700 dark:text-zinc-300"
          style={{ fontSize: (14 * shown) / applied }}
        >
          Aperçu du texte avec cette taille
        </p>
      </div>
    </SettingsPanel>
  );
}

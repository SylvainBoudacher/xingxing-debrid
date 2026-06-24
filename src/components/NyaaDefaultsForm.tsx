import { useEffect, useState } from "react";
import { CODECS, LANGUAGES, QUALITIES } from "@/lib/nyaaFilters";
import {
  EMPTY_NYAA_DEFAULTS,
  loadNyaaDefaults,
  saveNyaaDefaults,
  type NyaaDefaults,
} from "@/lib/nyaaDefaults";

const FIELD =
  "h-9 w-full rounded-lg bg-white dark:bg-zinc-900/80 ring-1 ring-black/10 dark:ring-white/10 text-sm text-zinc-700 dark:text-zinc-200 px-3 outline-none focus:ring-indigo-500 transition-colors";

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} cursor-pointer`}
      >
        <option value="">Aucune</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NyaaDefaultsForm() {
  const [defaults, setDefaults] = useState<NyaaDefaults>(EMPTY_NYAA_DEFAULTS);

  useEffect(() => {
    loadNyaaDefaults().then(setDefaults);
  }, []);

  function update(patch: Partial<NyaaDefaults>) {
    const next = { ...defaults, ...patch };
    setDefaults(next);
    saveNyaaDefaults(next);
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Team</span>
        <input
          value={defaults.team}
          onChange={(e) => update({ team: e.target.value })}
          placeholder="ex. Xspitfire911"
          className={`${FIELD} placeholder:text-zinc-400`}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Qualité"
          value={defaults.quality}
          options={QUALITIES}
          onChange={(v) => update({ quality: v })}
        />
        <SelectField
          label="Codec"
          value={defaults.codec}
          options={CODECS}
          onChange={(v) => update({ codec: v })}
        />
        <SelectField
          label="Langue"
          value={defaults.language}
          options={LANGUAGES}
          onChange={(v) => update({ language: v })}
        />
      </div>
    </div>
  );
}

import { motion, type Variants } from "motion/react";
import { ANY, CODECS, LANGUAGES, QUALITIES } from "@/lib/nyaaFilters";

const CONTROL =
  "h-8 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-xs font-medium text-zinc-600 dark:text-zinc-300 px-3 outline-none focus:ring-indigo-500 cursor-pointer transition-colors";

interface NyaaSearchFiltersProps {
  team: string;
  quality: string;
  codec: string;
  language: string;
  teamSuggestions: string[];
  itemVariants: Variants;
  onTeam: (v: string) => void;
  onQuality: (v: string) => void;
  onCodec: (v: string) => void;
  onLanguage: (v: string) => void;
}

function NyaaSelect({
  value,
  options,
  placeholder,
  itemVariants,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  itemVariants: Variants;
  onChange: (v: string) => void;
}) {
  return (
    <motion.select
      variants={itemVariants}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={CONTROL}
    >
      <option value={ANY}>{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </motion.select>
  );
}

export function NyaaSearchFilters({
  team,
  quality,
  codec,
  language,
  teamSuggestions,
  itemVariants,
  onTeam,
  onQuality,
  onCodec,
  onLanguage,
}: NyaaSearchFiltersProps) {
  return (
    <>
      <motion.input
        variants={itemVariants}
        list="nyaa-teams"
        value={team}
        onChange={(e) => onTeam(e.target.value)}
        placeholder="team"
        className={`${CONTROL} w-28 cursor-text placeholder:text-zinc-400`}
      />
      <datalist id="nyaa-teams">
        {teamSuggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <NyaaSelect
        value={quality}
        options={QUALITIES}
        placeholder="qualité"
        itemVariants={itemVariants}
        onChange={onQuality}
      />
      <NyaaSelect
        value={codec}
        options={CODECS}
        placeholder="codec"
        itemVariants={itemVariants}
        onChange={onCodec}
      />
      <NyaaSelect
        value={language}
        options={LANGUAGES}
        placeholder="langue"
        itemVariants={itemVariants}
        onChange={onLanguage}
      />
    </>
  );
}

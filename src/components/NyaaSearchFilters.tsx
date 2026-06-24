import { motion, type Variants } from "motion/react";
import { ChevronDown, Cpu, Languages, MonitorPlay, Users, type LucideIcon } from "lucide-react";
import { ANY, CODECS, LANGUAGES, QUALITIES } from "@/lib/nyaaFilters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const PILL_BASE =
  "h-8 rounded-full text-xs font-medium shadow-sm ring-1 outline-none transition-colors";
const PILL_IDLE =
  "bg-white/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80";
const ACCENT = "text-zinc-400 dark:text-zinc-500";

function NyaaSelect({
  value,
  options,
  placeholder,
  icon: Icon,
  itemVariants,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  icon: LucideIcon;
  itemVariants: Variants;
  onChange: (v: string) => void;
}) {
  const label = value === ANY ? placeholder : value;

  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${PILL_BASE} ${PILL_IDLE} flex cursor-pointer items-center gap-1.5 pl-8 pr-7 relative`}
          >
            <Icon className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${ACCENT}`} />
            <span>{label}</span>
            <ChevronDown
              className={`absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 ${ACCENT}`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[7rem]">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            <DropdownMenuRadioItem value={ANY}>{placeholder}</DropdownMenuRadioItem>
            {options.map((o) => (
              <DropdownMenuRadioItem key={o} value={o}>
                {o}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
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
      <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="relative">
        <Users
          className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${ACCENT}`}
        />
        <input
          list="nyaa-teams"
          value={team}
          onChange={(e) => onTeam(e.target.value)}
          placeholder="Team"
          className={`${PILL_BASE} ${PILL_IDLE} w-32 cursor-text pl-8 pr-3 placeholder:text-zinc-400`}
        />
        <datalist id="nyaa-teams">
          {teamSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </motion.div>
      <NyaaSelect
        value={quality}
        options={QUALITIES}
        placeholder="Qualite"
        icon={MonitorPlay}
        itemVariants={itemVariants}
        onChange={onQuality}
      />
      <NyaaSelect
        value={codec}
        options={CODECS}
        placeholder="Codec"
        icon={Cpu}
        itemVariants={itemVariants}
        onChange={onCodec}
      />
      <NyaaSelect
        value={language}
        options={LANGUAGES}
        placeholder="Langue"
        icon={Languages}
        itemVariants={itemVariants}
        onChange={onLanguage}
      />
    </>
  );
}

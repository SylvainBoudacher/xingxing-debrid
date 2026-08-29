import { RouletteSourceButton, type SourceAccent } from "@/components/RouletteSourceButton";
import { LETTERBOXD_POOL_SIZE, WORST_POOL_SIZE, type RouletteSource } from "@/lib/rouletteSource";
import { Clapperboard, Skull, Trophy } from "lucide-react";

interface RouletteSourcePickerProps {
  source: RouletteSource;
  /** Desactive pendant le chargement et l'animation. */
  disabled: boolean;
  onSelect: (source: RouletteSource) => void;
}

const LETTERBOXD: SourceAccent = {
  activeBg: "#16803c",
  ringClass: "ring-[#00e054]/60",
  iconClass: "text-[#00e054]",
};

const WORST: SourceAccent = {
  activeBg: "#9f1239",
  ringClass: "ring-rose-400/60",
  iconClass: "text-rose-500",
};

// Les trois viviers sont exclusifs. Les deux classements portent leur couleur
// propre pour qu'on voie qu'ils ne sont pas le catalogue filtre.
export function RouletteSourcePicker({ source, disabled, onSelect }: RouletteSourcePickerProps) {
  return (
    <div>
      <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Vivier
      </span>

      <div className="flex flex-wrap gap-2">
        <RouletteSourceButton
          active={source === "tmdb"}
          disabled={disabled}
          Icon={Clapperboard}
          title="Catalogue TMDB"
          subtitle="Filtrable par genres"
          onClick={() => onSelect("tmdb")}
        />
        <RouletteSourceButton
          active={source === "letterboxd"}
          disabled={disabled}
          Icon={Trophy}
          title={`Top ${LETTERBOXD_POOL_SIZE} Letterboxd`}
          subtitle="Le haut du classement, sans filtre"
          onClick={() => onSelect("letterboxd")}
          accent={LETTERBOXD}
        />
        <RouletteSourceButton
          active={source === "worst"}
          disabled={disabled}
          Icon={Skull}
          title={`Top ${WORST_POOL_SIZE} des pires`}
          subtitle="Les plus mal notés de TMDB"
          onClick={() => onSelect("worst")}
          accent={WORST}
        />
      </div>
    </div>
  );
}

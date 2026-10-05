import { flowerName, RARITY_FR } from "../core/labels";
import type { Flower } from "../core/types";
import { RARITY_COLOR } from "./toolMeta";

// Au retour d'une longue absence, tout un champ peut éclore : on n'en nomme que quelques-unes.
const SHOWN = 3;

export function DiscoveryToast({ found }: { found: Flower[] }) {
  const rest = found.length - SHOWN;
  return (
    <div className="w-full text-center">
      <div className="text-xs text-[#a99a8a]">
        {found.length > 1 ? `${found.length} nouvelles découvertes` : "Nouvelle découverte"}
      </div>
      {found.slice(0, SHOWN).map((f) => (
        <b key={`${f.species}:${f.color}`} className="block font-serif text-base">
          {flowerName(f)}{" "}
          <span style={{ color: RARITY_COLOR[f.rarity] }}>
            ({RARITY_FR[f.rarity].toLowerCase()})
          </span>
        </b>
      ))}
      {rest > 0 && (
        <div className="mt-0.5 text-xs text-[#a99a8a]">
          et {rest} {rest > 1 ? "autres" : "autre"}, à retrouver dans l'Herbier
        </div>
      )}
    </div>
  );
}

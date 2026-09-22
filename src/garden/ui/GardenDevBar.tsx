import type { Tod } from "../render/tod";
import { DEV_BUTTON as button } from "./devButton";

const TODS: { id: Tod | null; label: string }[] = [
  { id: null, label: "Auto" },
  { id: "matin", label: "Matin" },
  { id: "midi", label: "Midi" },
  { id: "soir", label: "Soir" },
  { id: "nuit", label: "Nuit" },
];

export function GardenDevBar({
  tod,
  onTod,
  onSeed,
  onLeaves,
  onCrow,
  onAtelier,
}: {
  tod: Tod | null;
  onTod: (tod: Tod | null) => void;
  onSeed: () => void;
  onLeaves: () => void;
  onCrow: () => void;
  onAtelier: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-amber-300">Dev : heure</span>
        {TODS.map(({ id, label }) => (
          <button
            key={label}
            onClick={() => onTod(id)}
            aria-pressed={tod === id}
            className={`${button} ${tod === id ? "bg-amber-500/45 text-amber-100" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button onClick={onSeed} className={button}>
        Dev : semer des plantes de démonstration
      </button>
      <button onClick={onLeaves} className={button}>
        Dev : faire tomber des feuilles
      </button>
      <button onClick={onCrow} className={button}>
        Dev : faire venir un corbeau
      </button>
      <button onClick={onAtelier} className={button}>
        Dev : débloquer l'atelier et 3 doses de chaque préparation
      </button>
    </div>
  );
}

const button =
  "rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25";

export function GardenDevBar({
  onSeed,
  onLeaves,
  onCrow,
}: {
  onSeed: () => void;
  onLeaves: () => void;
  onCrow: () => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-1">
      <button onClick={onSeed} className={button}>
        Dev : semer des plantes de démonstration
      </button>
      <button onClick={onLeaves} className={button}>
        Dev : faire tomber des feuilles
      </button>
      <button onClick={onCrow} className={button}>
        Dev : faire venir un corbeau
      </button>
    </div>
  );
}

// Fronton de la borne: l'enseigne 777 et sa guirlande d'ampoules. Elles
// s'allument en chenillard quand un tirage est disponible, s'emballent pendant
// le tirage, et restent éteintes pendant le cooldown.

const BULBS = 11;

export function SlotMarquee({ lit, rolling }: { lit: boolean; rolling: boolean }) {
  const on = lit || rolling;
  return (
    <div className="relative mx-auto w-full rounded-t-[22px] bg-gradient-to-b from-[#7A1730] to-[#4A0C1C] px-4 pb-3 pt-2 ring-1 ring-amber-400/40">
      <div className="flex justify-between px-1">
        {Array.from({ length: BULBS }, (_, i) => (
          <span
            key={i}
            className={`h-[7px] w-[7px] rounded-full ${on ? "bg-amber-300 shadow-[0_0_6px_2px_rgba(251,191,36,0.7)]" : "bg-amber-200/20"}`}
            style={
              rolling
                ? { animation: `slot-bulb 0.3s ${i * 0.04}s infinite` }
                : lit
                  ? { animation: `slot-bulb 1.1s ${i * 0.1}s infinite` }
                  : undefined
            }
          />
        ))}
      </div>
      <p
        className={`mt-1.5 text-center font-mono text-2xl font-black tracking-[0.35em] ${
          on ? "text-[#FFE9F2] [text-shadow:0_0_10px_rgba(255,59,123,0.9)]" : "text-white/25"
        }`}
        style={rolling ? { animation: "slot-777 0.45s infinite" } : undefined}
      >
        777
      </p>
      <style>{`
        @keyframes slot-bulb { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }
        @keyframes slot-777 { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
      `}</style>
    </div>
  );
}

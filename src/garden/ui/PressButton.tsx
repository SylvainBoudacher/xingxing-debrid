import { useEffect, useState } from "react";

const ARMED_MS = 3000;

// Presser retire la fleur du panier pour de bon : un premier clic arme, le second presse.
export function PressButton({ onPress }: { onPress: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), ARMED_MS);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onPress();
      }}
      className={`rounded-md border px-1.5 py-0.5 text-[10px] ${
        armed
          ? "border-amber-300 bg-amber-300/25 text-[#fff1c4]"
          : "border-amber-300/40 text-[#f3dca0] hover:bg-amber-300/15"
      }`}
    >
      {armed ? "Confirmer ?" : "Presser"}
    </button>
  );
}

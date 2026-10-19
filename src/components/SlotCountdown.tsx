import { formatCountdown } from "@/lib/slotMachine";
import { PIXEL_FONT, PX } from "./slotPixel";

// Compteur sous l'afficheur, toujours présent: il reste visible pendant qu'un
// résultat est affiché et ne fait pas bouger la borne quand il change d'état.
export function SlotCountdown({ ready, remaining }: { ready: boolean; remaining: number }) {
  return (
    <p
      className="mt-3 text-center text-[17px] leading-none"
      style={{ fontFamily: PIXEL_FONT, color: ready ? PX.goldLight : PX.ivory }}
    >
      {ready ? "Tirage disponible" : `Prochain tirage dans ${formatCountdown(remaining)}`}
    </p>
  );
}

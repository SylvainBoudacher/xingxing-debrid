import { LocateFixed, Move } from "lucide-react";
import type { CameraMode } from "../core/types";

export function PotagerHud({ mode, onToggleMode }: { mode: CameraMode; onToggleMode: () => void }) {
  const follow = mode === "follow";
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 top-6 py-2.5 pl-8 pr-16 text-[40px] font-bold italic text-[#f2e2b0]"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          textShadow: "0 2px 3px rgba(0,0,0,0.7)",
          background:
            "linear-gradient(90deg, rgba(20,14,10,0.85), rgba(20,14,10,0.55) 80%, rgba(20,14,10,0))",
          borderTop: "2px solid #b8975a",
          borderBottom: "2px solid #b8975a",
          clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)",
        }}
      >
        Le Potager
      </div>
      <button
        type="button"
        onClick={onToggleMode}
        aria-label={follow ? "Passer en caméra libre" : "Faire suivre l'avatar par la caméra"}
        className="absolute bottom-6 right-6 flex cursor-pointer items-center gap-2 border-r-2 border-[#b8975a] px-4 py-2 text-lg font-semibold text-[#f6ecd2] transition-colors hover:text-white"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          textShadow: "0 2px 3px rgba(0,0,0,0.7)",
          background: "linear-gradient(270deg, rgba(20,14,10,0.8), rgba(20,14,10,0))",
        }}
      >
        {follow ? <LocateFixed className="size-4" /> : <Move className="size-4" />}
        {follow ? "Caméra : suit l'avatar" : "Caméra : libre"}
      </button>
    </>
  );
}

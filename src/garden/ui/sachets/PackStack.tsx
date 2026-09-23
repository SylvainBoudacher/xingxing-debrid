import type { ReactNode } from "react";
import type { SachetType } from "../../core/types";
import { SACHET_H, SACHET_W, sachetDataUrl } from "../../sprites/sachet";
import { PACK_SCALE } from "./packFlow";

const TILT = [-7, 5, -3, 8, -5, 3];

// Sachets en attente sous celui du dessus, décalés et tournés ; les plus profonds d'abord.
export function PackStack({ under, children }: { under: SachetType[]; children: ReactNode }) {
  const shown = under.slice(0, TILT.length);
  return (
    <div
      className="relative"
      style={{ width: SACHET_W * PACK_SCALE, height: SACHET_H * PACK_SCALE }}
    >
      {shown
        .map((type, i) => (
          <img
            key={i}
            src={sachetDataUrl(type)}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full brightness-75 [image-rendering:pixelated]"
            style={{
              transform: `translate(${(i + 1) * 6}px, ${(i + 1) * 5}px) rotate(${TILT[i]}deg)`,
            }}
          />
        ))
        .reverse()}
      {children}
    </div>
  );
}

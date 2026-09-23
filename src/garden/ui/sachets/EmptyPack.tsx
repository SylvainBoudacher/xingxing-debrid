import { SACHET_H, SACHET_W, sachetDataUrl } from "../../sprites/sachet";
import { PACK_SCALE } from "./packFlow";

export function EmptyPack() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={sachetDataUrl("quotidien")}
        alt=""
        draggable={false}
        className="brightness-50 grayscale [image-rendering:pixelated]"
        style={{ width: SACHET_W * PACK_SCALE, height: SACHET_H * PACK_SCALE }}
      />
      <p className="text-xs text-[#a99a8a]">Prochain sachet à minuit</p>
    </div>
  );
}

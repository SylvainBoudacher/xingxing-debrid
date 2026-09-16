import { VARIANT_FR } from "../../core/labels";
import type { VariantId } from "../../core/types";

const ORDER: VariantId[] = ["givree", "doree", "lumineuse"];
const DOT: Record<VariantId, string> = {
  givree: "#a8d0ee",
  doree: "#f3c34a",
  lumineuse: "#9fe0d0",
};

export function VariantSlots({
  seen,
  shown,
  onToggle,
}: {
  seen: VariantId[];
  shown: VariantId | null;
  onToggle: (variant: VariantId) => void;
}) {
  return (
    <div className="mt-1 flex justify-center gap-1.5">
      {ORDER.map((v) => {
        const has = seen.includes(v);
        return (
          <button
            key={v}
            disabled={!has}
            onClick={() => onToggle(v)}
            title={has ? VARIANT_FR[v] : `${VARIANT_FR[v]} : pas encore vue`}
            aria-label={VARIANT_FR[v]}
            aria-pressed={shown === v}
            className={`size-3.5 rounded-full border-2 disabled:cursor-default ${
              shown === v ? "border-[#3a2418]" : "border-[#b08a5a]"
            }`}
            style={{ background: has ? DOT[v] : "transparent" }}
          />
        );
      })}
    </div>
  );
}

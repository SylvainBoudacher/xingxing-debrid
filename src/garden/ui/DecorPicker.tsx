import { DECOR_FR } from "../core/labels";
import type { DecorId } from "../core/types";
import { SpriteIcon } from "./SpriteIcon";

export function DecorPicker({
  decor,
  selected,
  onSelect,
}: {
  decor: Record<string, number>;
  selected: DecorId | null;
  onSelect: (decor: DecorId) => void;
}) {
  const owned = (Object.entries(decor) as [DecorId, number][]).filter(([, n]) => n > 0);
  return (
    <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-2.5 py-2 backdrop-blur">
      <h4 className="mb-1.5 font-serif text-[17px] text-[#f3dca0]">Décor</h4>
      {!owned.length && (
        <em className="text-[11px] text-[#a99a8a]">
          Rien à poser. L'arbre de progression en donne.
        </em>
      )}
      <div className="flex flex-col gap-0.5">
        {owned.map(([id, n]) => {
          const on = id === selected;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left ${
                on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
              }`}
            >
              <SpriteIcon sprite={{ name: id }} cropped className="h-5" />
              {DECOR_FR[id]}
              <b className="ml-auto text-[#f3dca0]">x{n}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}

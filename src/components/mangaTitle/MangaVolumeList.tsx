import { MangaMissingRow } from "@/components/mangaTitle/MangaMissingRow";
import { MangaVolumeRow } from "@/components/mangaTitle/MangaVolumeRow";
import { volumeKey, type ShelfContext } from "@/components/mangaTitle/volumeActions";
import type { ShelfSlot } from "@/lib/mangaShelf";

interface MangaVolumeListProps {
  ctx: ShelfContext;
  slots: ShelfSlot[];
}

export function MangaVolumeList({ ctx, slots }: MangaVolumeListProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {slots.map((slot) =>
        slot.kind === "owned" ? (
          <MangaVolumeRow
            key={volumeKey(slot.volume)}
            ctx={ctx}
            volume={slot.volume}
            coverFileName={slot.coverFileName}
          />
        ) : (
          <MangaMissingRow
            key={`missing-${slot.number}`}
            ctx={ctx}
            number={slot.number}
            coverFileName={slot.coverFileName}
          />
        ),
      )}
    </ul>
  );
}

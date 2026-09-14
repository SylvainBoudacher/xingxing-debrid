import { MangaMissingCard } from "@/components/mangaTitle/MangaMissingCard";
import { MangaVolumeCard } from "@/components/mangaTitle/MangaVolumeCard";
import { volumeKey, type ShelfContext } from "@/components/mangaTitle/volumeActions";
import type { ShelfSlot } from "@/lib/mangaShelf";

interface MangaVolumeGridProps {
  ctx: ShelfContext;
  slots: ShelfSlot[];
}

export function MangaVolumeGrid({ ctx, slots }: MangaVolumeGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-4 gap-y-6">
      {slots.map((slot) =>
        slot.kind === "owned" ? (
          <MangaVolumeCard
            key={volumeKey(slot.volume)}
            ctx={ctx}
            volume={slot.volume}
            coverFileName={slot.coverFileName}
          />
        ) : (
          <MangaMissingCard
            key={`missing-${slot.number}`}
            ctx={ctx}
            number={slot.number}
            coverFileName={slot.coverFileName}
          />
        ),
      )}
    </div>
  );
}

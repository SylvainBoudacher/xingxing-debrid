import { LibraryEntryCard, type DebridControls } from "@/components/LibraryEntryCard";
import type { LibraryEntry } from "@/lib/library";
import type { MagnetEntry } from "@/lib/services/allDebrid";
import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

interface LibraryReorderableCardProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  onOpen: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay?: boolean;
  magnet?: MagnetEntry;
  onCancelDebrid?: (entry: LibraryEntry) => void;
  cancellingDebrid?: boolean;
}

export function LibraryReorderableCard({ entry, ...props }: LibraryReorderableCardProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-1.5"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="flex h-7 w-5 flex-none cursor-grab touch-none items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <LibraryEntryCard entry={entry} {...props} />
      </div>
    </Reorder.Item>
  );
}

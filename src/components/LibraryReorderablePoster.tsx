import type { ReactNode } from "react";
import { GripHorizontal } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import type { LibraryEntry } from "@/lib/library";

interface LibraryReorderablePosterProps {
  entry: LibraryEntry;
  children: ReactNode;
}

// Les coins sont pris (pastille « vu », suppression) : la poignée se place en haut au centre.
export function LibraryReorderablePoster({ entry, children }: LibraryReorderablePosterProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={entry}
      dragListener={false}
      dragControls={controls}
      className="group/reorder relative"
    >
      {children}
      <button
        onPointerDown={(e) => controls.start(e)}
        title="Glisser pour déplacer"
        className="absolute left-1/2 top-1.5 z-20 flex h-6 w-9 -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow backdrop-blur-sm transition-opacity hover:bg-black/70 focus:opacity-100 active:cursor-grabbing group-hover/reorder:opacity-100"
      >
        <GripHorizontal className="h-4 w-4" />
      </button>
    </Reorder.Item>
  );
}

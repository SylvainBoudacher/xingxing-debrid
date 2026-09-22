import { useRef, type ReactNode } from "react";
import { RecenterButton } from "../RecenterButton";
import { TreeLegend } from "./TreeLegend";
import { usePanZoom } from "./usePanZoom";

export function TreeViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { view, tree, dragging, moved, recenter, handlers } = usePanZoom(ref);
  return (
    <div className="relative flex-1 overflow-hidden rounded-xl border border-amber-300/25 bg-[#1c1418]/80 bg-[radial-gradient(55%_65%_at_50%_55%,rgba(143,207,90,.12),transparent_70%)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#3a2a1c]/80 to-transparent" />
      <div
        ref={ref}
        {...handlers}
        className={`absolute inset-0 touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: tree.w,
            height: tree.h,
            transform: `translate(-50%, -50%) translate(${view.dx}px, ${view.dy}px) scale(${view.k})`,
          }}
        >
          {children}
        </div>
      </div>
      <TreeLegend />
      {moved && (
        <RecenterButton onClick={recenter} label="Recentrer" className="bottom-3 right-3" />
      )}
    </div>
  );
}

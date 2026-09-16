import { useEffect } from "react";
import { TOOLS, type Tool } from "../core/actions";
import { SpriteIcon } from "./SpriteIcon";
import { TOOL_META } from "./toolMeta";

export function ToolBar({ tool, onSelect }: { tool: Tool; onSelect: (tool: Tool) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect("main");
      const next = TOOLS[Number(e.key) - 1];
      if (next) onSelect(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-2xl border border-amber-300/35 bg-[#1a1216]/85 p-1.5 backdrop-blur">
      {TOOLS.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-pressed={tool === id}
          className={`relative flex h-[58px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10.5px] ${
            tool === id
              ? "border-[#d9b46a] bg-amber-300/20 shadow-[0_0_12px_rgba(243,220,160,0.3)]"
              : "border-amber-300/20 bg-black/25 hover:bg-black/40"
          }`}
        >
          <span className="absolute left-1.5 top-0.5 text-[9px] text-[#a99a8a]">{i + 1}</span>
          <SpriteIcon sprite={TOOL_META[id].icon} className="-mt-3 w-[26px]" />
          {TOOL_META[id].label}
        </button>
      ))}
    </div>
  );
}

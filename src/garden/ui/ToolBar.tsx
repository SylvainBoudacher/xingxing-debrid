import { useEffect } from "react";
import type { Tool } from "../core/actions";
import { SpriteIcon } from "./SpriteIcon";
import { TOOL_META } from "./toolMeta";

export function ToolBar({
  tools,
  tool,
  onSelect,
}: {
  tools: Tool[];
  tool: Tool;
  onSelect: (tool: Tool) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect("main");
      const next = tools[Number(e.key) - 1];
      if (next) onSelect(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect, tools]);

  return (
    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-2xl border border-amber-300/35 bg-[#1a1216]/85 p-2 backdrop-blur">
      {tools.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-pressed={tool === id}
          className={`relative flex h-20 w-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border text-[13px] ${
            tool === id
              ? "border-[#d9b46a] bg-amber-300/20 shadow-[0_0_12px_rgba(243,220,160,0.3)]"
              : "border-amber-300/20 bg-black/25 hover:bg-black/40"
          }`}
        >
          <span className="absolute left-2 top-1 text-[11px] text-[#a99a8a]">{i + 1}</span>
          <SpriteIcon sprite={TOOL_META[id].icon} cropped className="h-10 w-auto" />
          {TOOL_META[id].label}
        </button>
      ))}
    </div>
  );
}

import type { HoverView } from "./hover";

export function TileTooltip({ x, y, view }: { x: number; y: number; view: HoverView }) {
  const { info, plan, movable } = view;
  return (
    <div
      className="pointer-events-none absolute max-w-[230px] translate-x-3.5 translate-y-3.5 rounded-[10px] border border-amber-300/35 bg-[#1a1216]/90 px-2.5 py-1.5 text-xs"
      style={{ left: x, top: y }}
    >
      <b className="block font-serif text-base text-[#f3dca0]">{info.title}</b>
      {info.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {info.progress !== undefined && (
        <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#6aa83e] to-[#d9b46a]"
            style={{ width: `${info.progress * 100}%` }}
          />
        </div>
      )}
      {plan && (
        <div className={`mt-1 ${plan.ok ? "text-[#9fd46e]" : "text-[#d98a7a]"}`}>
          {plan.ok ? `Clic : ${plan.label}` : `${plan.label} : ${plan.reason}`}
        </div>
      )}
      {movable && <div className="mt-1 text-[#a99a8a]">Maintenir et glisser pour déplacer</div>}
    </div>
  );
}

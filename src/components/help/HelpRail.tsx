import { motion } from "motion/react";
import { HELP_GROUPS, type HelpPanelId } from "./helpNav";

export function HelpRail({
  active,
  onSelect,
}: {
  active: HelpPanelId;
  onSelect: (id: HelpPanelId) => void;
}) {
  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-24 flex flex-col gap-5">
        {HELP_GROUPS.map((g) => (
          <div key={g.id}>
            <div className="mb-2 flex items-center gap-2 px-3">
              <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-900 dark:text-white">
                {g.label}
              </p>
              <div className="h-px flex-1 bg-black/8 dark:bg-white/8" />
            </div>
            <div className="flex flex-col gap-1">
              {g.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="help-rail-active"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/8 dark:ring-white/8"
                      />
                    )}
                    <item.icon
                      className={`relative z-10 h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}
                    />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

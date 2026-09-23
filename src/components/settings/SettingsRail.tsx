import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { SETTINGS_GROUPS, type PanelId } from "./settingsNav";

export function SettingsRail({
  active,
  onSelect,
}: {
  active: PanelId;
  onSelect: (id: PanelId) => void;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SETTINGS_GROUPS;
    return SETTINGS_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-24 flex flex-col gap-5 rounded-2xl border border-black/8 bg-white/70 p-2 pt-4 backdrop-blur-md dark:border-white/12 dark:bg-zinc-900/80">
        <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-2.5 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un réglage"
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
          />
        </div>

        {groups.length === 0 && <p className="px-3 text-xs text-zinc-400">Aucun réglage trouvé.</p>}

        {groups.map((g) => (
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
                const accentIcon =
                  item.accent === "amber"
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-indigo-600 dark:text-indigo-400";
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settings-rail-active"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-white/90 dark:bg-zinc-700/60 ring-1 ring-black/8 dark:ring-white/10"
                      />
                    )}
                    <item.icon
                      className={`relative z-10 h-3.5 w-3.5 shrink-0 ${isActive ? accentIcon : ""}`}
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
